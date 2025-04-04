const Redis = require('ioredis');
const { sendDiscordAlert } = require('./discordService');

class SecurityAnalytics {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.eventWindow = 86400; // 24 hours in seconds
    this.riskThresholds = {
      low: 0.3,
      medium: 0.6,
      high: 0.8
    };
  }

  // Track security event
  async trackEvent(event) {
    const timestamp = Date.now();
    const key = `security:events:${event.type}`;
    
    // Add event to sorted set
    await this.redis.zadd(key, timestamp, JSON.stringify({
      ...event,
      timestamp
    }));
    
    // Remove old events
    const cutoff = timestamp - (this.eventWindow * 1000);
    await this.redis.zremrangebyscore(key, 0, cutoff);
    
    // Set key expiration
    await this.redis.expire(key, this.eventWindow);
    
    // Update risk score
    await this.updateRiskScore(event.ip);
  }

  // Calculate risk score for an IP
  async calculateRiskScore(ip) {
    const events = await this.getEventsByIP(ip);
    if (events.length === 0) return 0;
    
    let score = 0;
    const weights = {
      'rate_limit_exceeded': 0.3,
      'suspicious_pattern': 0.4,
      'geographic_block': 0.5,
      'failed_login': 0.6,
      'brute_force_attempt': 0.8
    };
    
    events.forEach(event => {
      score += weights[event.type] || 0.2;
    });
    
    return Math.min(1, score / events.length);
  }

  // Update risk score for an IP
  async updateRiskScore(ip) {
    const score = await this.calculateRiskScore(ip);
    const key = `security:risk:${ip}`;
    
    await this.redis.setex(key, this.eventWindow, score);
    
    // Send alert for high risk scores
    if (score >= this.riskThresholds.high) {
      const alert = {
        title: '🚨 High Risk IP Detected',
        description: 'An IP has been identified as high risk',
        fields: [
          { name: 'IP Address', value: ip },
          { name: 'Risk Score', value: score.toString() },
          { name: 'Events', value: (await this.getEventsByIP(ip)).length.toString() }
        ],
        color: 0xFF0000,
        timestamp: new Date()
      };
      
      await sendDiscordAlert(alert);
    }
  }

  // Get events by IP
  async getEventsByIP(ip) {
    const keys = await this.redis.keys('security:events:*');
    let events = [];
    
    for (const key of keys) {
      const keyEvents = await this.redis.zrange(key, 0, -1);
      events = events.concat(
        keyEvents
          .map(event => JSON.parse(event))
          .filter(event => event.ip === ip)
      );
    }
    
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get risk score for an IP
  async getRiskScore(ip) {
    const key = `security:risk:${ip}`;
    const score = await this.redis.get(key);
    return score ? parseFloat(score) : 0;
  }

  // Get risk level based on score
  getRiskLevel(score) {
    if (score >= this.riskThresholds.high) return 'high';
    if (score >= this.riskThresholds.medium) return 'medium';
    if (score >= this.riskThresholds.low) return 'low';
    return 'normal';
  }

  // Get security statistics
  async getStatistics() {
    const keys = await this.redis.keys('security:events:*');
    const stats = {
      totalEvents: 0,
      eventsByType: {},
      riskLevels: {
        high: 0,
        medium: 0,
        low: 0,
        normal: 0
      }
    };
    
    for (const key of keys) {
      const events = await this.redis.zrange(key, 0, -1);
      const type = key.split(':')[2];
      
      stats.totalEvents += events.length;
      stats.eventsByType[type] = events.length;
      
      events.forEach(event => {
        const parsed = JSON.parse(event);
        const score = this.getRiskLevel(parsed.riskScore || 0);
        stats.riskLevels[score]++;
      });
    }
    
    return stats;
  }
}

module.exports = new SecurityAnalytics(); 