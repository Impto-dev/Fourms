const Redis = require('ioredis');
const { sendDiscordAlert } = require('./discordService');

class AdvancedRateLimit {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.patternWindow = 3600; // 1 hour in seconds
    this.geoBlockWindow = 86400; // 24 hours in seconds
    this.defaultThresholds = {
      normal: {
        hourly: 100,
        daily: 1000,
        weekly: 5000
      },
      suspicious: {
        hourly: 50,
        daily: 500,
        weekly: 2500
      },
      blocked: {
        hourly: 10,
        daily: 100,
        weekly: 500
      }
    };
  }

  // Track request pattern for an IP
  async trackPattern(ip, type) {
    const key = `pattern:${ip}:${type}`;
    const timestamp = Date.now();
    
    // Add request to pattern list
    await this.redis.zadd(key, timestamp, `${timestamp}:${type}`);
    
    // Remove old entries
    const cutoff = timestamp - (this.patternWindow * 1000);
    await this.redis.zremrangebyscore(key, 0, cutoff);
    
    // Set key expiration
    await this.redis.expire(key, this.patternWindow);
  }

  // Analyze request pattern
  async analyzePattern(ip, type) {
    const key = `pattern:${ip}:${type}`;
    const pattern = await this.redis.zrange(key, 0, -1);
    
    if (pattern.length < 10) return 'normal';
    
    const timestamps = pattern.map(entry => parseInt(entry.split(':')[0]));
    const intervals = [];
    
    // Calculate intervals between requests
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    
    // Check for suspicious patterns
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    
    if (variance < 1000 || avgInterval < 1000) {
      return 'suspicious';
    }
    
    return 'normal';
  }

  // Get adaptive thresholds based on pattern
  async getThresholds(ip, type) {
    const pattern = await this.analyzePattern(ip, type);
    return this.defaultThresholds[pattern];
  }

  // Check if IP should be blocked based on geographic location
  async checkGeographicBlock(ip) {
    const key = `geo:block:${ip}`;
    const isBlocked = await this.redis.get(key);
    
    if (isBlocked) {
      const ttl = await this.redis.ttl(key);
      return {
        blocked: true,
        until: new Date(Date.now() + ttl * 1000)
      };
    }
    
    return { blocked: false };
  }

  // Block IP based on geographic location
  async blockGeographicIP(ip, reason, duration = 86400) {
    const key = `geo:block:${ip}`;
    await this.redis.setex(key, duration, 'blocked');
    
    // Send alert
    const alert = {
      title: '🌍 Geographic IP Block',
      description: 'An IP has been blocked based on geographic location',
      fields: [
        { name: 'IP Address', value: ip },
        { name: 'Reason', value: reason },
        { name: 'Duration', value: `${duration / 3600} hours` }
      ],
      color: 0xFF0000,
      timestamp: new Date()
    };
    
    await sendDiscordAlert(alert);
  }

  // Update thresholds based on system load
  async updateThresholds(loadFactor) {
    const thresholds = { ...this.defaultThresholds };
    
    // Adjust thresholds based on system load
    if (loadFactor > 0.8) {
      // Reduce thresholds under high load
      Object.keys(thresholds).forEach(pattern => {
        Object.keys(thresholds[pattern]).forEach(period => {
          thresholds[pattern][period] = Math.floor(thresholds[pattern][period] * 0.7);
        });
      });
    } else if (loadFactor < 0.3) {
      // Increase thresholds under low load
      Object.keys(thresholds).forEach(pattern => {
        Object.keys(thresholds[pattern]).forEach(period => {
          thresholds[pattern][period] = Math.floor(thresholds[pattern][period] * 1.3);
        });
      });
    }
    
    this.defaultThresholds = thresholds;
    
    // Send alert about threshold update
    const alert = {
      title: '⚙️ Adaptive Thresholds Updated',
      description: 'Rate limit thresholds have been adjusted based on system load',
      fields: [
        { name: 'Load Factor', value: loadFactor.toString() },
        { name: 'New Thresholds', value: JSON.stringify(thresholds, null, 2) }
      ],
      color: 0xFFFF00,
      timestamp: new Date()
    };
    
    await sendDiscordAlert(alert);
  }

  // Get current thresholds
  getCurrentThresholds() {
    return this.defaultThresholds;
  }
}

module.exports = new AdvancedRateLimit(); 