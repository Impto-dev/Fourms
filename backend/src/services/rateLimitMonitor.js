const Redis = require('ioredis');
const { sendDiscordAlert } = require('./discordService');

class RateLimitMonitor {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.violationThresholds = {
      hourly: 10,    // Alert after 10 violations per hour
      daily: 30,     // Alert after 30 violations per day
      weekly: 100    // Alert after 100 violations per week
    };
    this.monitoringWindows = {
      hourly: 60 * 60,        // 1 hour in seconds
      daily: 24 * 60 * 60,    // 24 hours in seconds
      weekly: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  async recordViolation(type, ip, userId = 'anonymous') {
    const timestamp = Date.now();
    const violationData = JSON.stringify({
      type,
      ip,
      userId,
      timestamp
    });

    try {
      // Add violation to time-series list
      const key = `ratelimit:violations:${type}`;
      await this.redis.lpush(key, violationData);

      // Update violation counters
      await Promise.all([
        this.incrementCounter('hourly', type, ip, userId),
        this.incrementCounter('daily', type, ip, userId),
        this.incrementCounter('weekly', type, ip, userId)
      ]);

      // Check thresholds and send alerts if needed
      await this.checkThresholds(type, ip, userId);
    } catch (error) {
      console.error('Error recording rate limit violation:', error);
    }
  }

  async incrementCounter(period, type, ip, userId) {
    const key = `ratelimit:counter:${period}:${type}:${ip}:${userId}`;
    await this.redis.multi()
      .incr(key)
      .expire(key, this.monitoringWindows[period])
      .exec();
  }

  async checkThresholds(type, ip, userId) {
    try {
      const counts = await Promise.all([
        this.getViolationCount('hourly', type, ip, userId),
        this.getViolationCount('daily', type, ip, userId),
        this.getViolationCount('weekly', type, ip, userId)
      ]);

      const [hourlyCount, dailyCount, weeklyCount] = counts;
      const alerts = [];

      if (hourlyCount === this.violationThresholds.hourly) {
        alerts.push(this.createAlert('hourly', type, ip, userId, hourlyCount));
      }
      if (dailyCount === this.violationThresholds.daily) {
        alerts.push(this.createAlert('daily', type, ip, userId, dailyCount));
      }
      if (weeklyCount === this.violationThresholds.weekly) {
        alerts.push(this.createAlert('weekly', type, ip, userId, weeklyCount));
      }

      // Send alerts to Discord
      for (const alert of alerts) {
        await this.sendAlert(alert);
      }

      // If weekly threshold is exceeded, trigger IP blocking
      if (weeklyCount >= this.violationThresholds.weekly) {
        await this.handleSuspiciousActivity(ip, userId, type);
      }
    } catch (error) {
      console.error('Error checking rate limit thresholds:', error);
    }
  }

  async getViolationCount(period, type, ip, userId) {
    const key = `ratelimit:counter:${period}:${type}:${ip}:${userId}`;
    const count = await this.redis.get(key);
    return parseInt(count) || 0;
  }

  createAlert(period, type, ip, userId, count) {
    return {
      title: '🚨 Rate Limit Violation Alert',
      description: `Threshold reached for ${type} endpoint`,
      fields: [
        { name: 'Period', value: period },
        { name: 'Violation Type', value: type },
        { name: 'IP Address', value: ip },
        { name: 'User ID', value: userId },
        { name: 'Violation Count', value: count.toString() },
        { name: 'Threshold', value: this.violationThresholds[period].toString() }
      ],
      color: 0xFF0000, // Red color for alerts
      timestamp: new Date()
    };
  }

  async sendAlert(alert) {
    try {
      await sendDiscordAlert(alert);
    } catch (error) {
      console.error('Error sending rate limit alert:', error);
    }
  }

  async handleSuspiciousActivity(ip, userId, type) {
    const suspiciousActivity = {
      title: '⛔ Suspicious Activity Detected',
      description: 'Weekly rate limit threshold exceeded - Blocking IP',
      fields: [
        { name: 'IP Address', value: ip },
        { name: 'User ID', value: userId },
        { name: 'Violation Type', value: type },
        { name: 'Action Taken', value: 'IP blocked for 24 hours' }
      ],
      color: 0x800000, // Dark red for serious alerts
      timestamp: new Date()
    };

    // Send suspicious activity alert
    await this.sendAlert(suspiciousActivity);

    // Add IP to blocked list for 24 hours
    const key = `ratelimit:blocked:${ip}`;
    await this.redis.setex(key, 24 * 60 * 60, 'blocked');
  }

  async isIPBlocked(ip) {
    const key = `ratelimit:blocked:${ip}`;
    return await this.redis.exists(key);
  }

  async getViolationStats(type, period = 'daily') {
    const key = `ratelimit:violations:${type}`;
    const cutoff = Date.now() - (this.monitoringWindows[period] * 1000);
    
    try {
      const violations = await this.redis.lrange(key, 0, -1);
      const recentViolations = violations
        .map(v => JSON.parse(v))
        .filter(v => v.timestamp > cutoff);

      return {
        total: recentViolations.length,
        uniqueIPs: new Set(recentViolations.map(v => v.ip)).size,
        uniqueUsers: new Set(recentViolations.map(v => v.userId)).size,
        period
      };
    } catch (error) {
      console.error('Error getting violation stats:', error);
      return null;
    }
  }

  // Get all currently blocked IPs
  async getBlockedIPs() {
    try {
      const keys = await this.redis.keys('ratelimit:blocked:*');
      const blockedIPs = [];
      
      for (const key of keys) {
        const ip = key.split(':')[2];
        const ttl = await this.redis.ttl(key);
        blockedIPs.push({
          ip,
          blockedUntil: new Date(Date.now() + ttl * 1000)
        });
      }
      
      return blockedIPs;
    } catch (error) {
      console.error('Error getting blocked IPs:', error);
      return [];
    }
  }

  // Get detailed violation history
  async getViolationHistory(type, period = 'daily', limit = 100) {
    try {
      const key = `ratelimit:violations:${type}`;
      const cutoff = Date.now() - (this.monitoringWindows[period] * 1000);
      
      const violations = await this.redis.lrange(key, 0, limit - 1);
      return violations
        .map(v => JSON.parse(v))
        .filter(v => v.timestamp > cutoff)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting violation history:', error);
      return [];
    }
  }

  // Get IP-specific statistics
  async getIPStats(ip) {
    try {
      const types = ['2fa_setup', '2fa_verify', '2fa_backup', '2fa_recovery', '2fa_disable'];
      const periods = ['hourly', 'daily', 'weekly'];
      
      const stats = {
        totalViolations: 0,
        violationTypes: {},
        periods: {}
      };

      // Get violations by type
      for (const type of types) {
        const key = `ratelimit:violations:${type}`;
        const violations = await this.redis.lrange(key, 0, -1);
        const ipViolations = violations
          .map(v => JSON.parse(v))
          .filter(v => v.ip === ip);
        
        stats.violationTypes[type] = ipViolations.length;
        stats.totalViolations += ipViolations.length;
      }

      // Get violations by period
      for (const period of periods) {
        const cutoff = Date.now() - (this.monitoringWindows[period] * 1000);
        const periodViolations = Object.values(stats.violationTypes)
          .reduce((sum, count) => sum + count, 0);
        
        stats.periods[period] = periodViolations;
      }

      // Check if IP is currently blocked
      stats.isBlocked = await this.isIPBlocked(ip);

      return stats;
    } catch (error) {
      console.error('Error getting IP stats:', error);
      return null;
    }
  }

  // Unblock an IP address
  async unblockIP(ip) {
    try {
      const key = `ratelimit:blocked:${ip}`;
      await this.redis.del(key);
      
      // Send alert about IP unblocking
      const alert = {
        title: '🔓 IP Unblocked',
        description: 'An IP address has been manually unblocked',
        fields: [
          { name: 'IP Address', value: ip },
          { name: 'Action', value: 'Manual unblock' }
        ],
        color: 0x00FF00, // Green color for unblocking
        timestamp: new Date()
      };
      
      await this.sendAlert(alert);
    } catch (error) {
      console.error('Error unblocking IP:', error);
      throw error;
    }
  }

  // Update rate limit thresholds
  async updateThresholds({ hourly, daily, weekly }) {
    try {
      if (hourly) this.violationThresholds.hourly = hourly;
      if (daily) this.violationThresholds.daily = daily;
      if (weekly) this.violationThresholds.weekly = weekly;

      // Send alert about threshold update
      const alert = {
        title: '⚙️ Rate Limit Thresholds Updated',
        description: 'Rate limit thresholds have been modified',
        fields: [
          { name: 'Hourly Threshold', value: this.violationThresholds.hourly.toString() },
          { name: 'Daily Threshold', value: this.violationThresholds.daily.toString() },
          { name: 'Weekly Threshold', value: this.violationThresholds.weekly.toString() }
        ],
        color: 0xFFFF00, // Yellow color for configuration changes
        timestamp: new Date()
      };
      
      await this.sendAlert(alert);
    } catch (error) {
      console.error('Error updating thresholds:', error);
      throw error;
    }
  }
}

module.exports = new RateLimitMonitor(); 