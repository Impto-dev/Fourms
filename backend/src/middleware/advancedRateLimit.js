const advancedRateLimit = require('../services/advancedRateLimit');
const { sendDiscordAlert } = require('../services/discordService');

const advancedRateLimiter = async (req, res, next) => {
  try {
    const ip = req.ip;
    const type = req.path.split('/')[1] || 'default';
    
    // Check geographic blocking first
    const geoBlock = await advancedRateLimit.checkGeographicBlock(ip);
    if (geoBlock.blocked) {
      return res.status(403).json({
        error: 'Access denied',
        message: `IP blocked until ${geoBlock.until}`,
        code: 'GEO_BLOCKED'
      });
    }
    
    // Track request pattern
    await advancedRateLimit.trackPattern(ip, type);
    
    // Get adaptive thresholds
    const thresholds = await advancedRateLimit.getThresholds(ip, type);
    
    // Check if request exceeds thresholds
    const key = `rate:${ip}:${type}`;
    const current = await advancedRateLimit.redis.incr(key);
    
    if (current === 1) {
      await advancedRateLimit.redis.expire(key, 3600); // 1 hour
    }
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', thresholds.hourly);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, thresholds.hourly - current));
    
    if (current > thresholds.hourly) {
      // Send alert about rate limit exceeded
      const alert = {
        title: '⚠️ Rate Limit Exceeded',
        description: 'A rate limit has been exceeded',
        fields: [
          { name: 'IP Address', value: ip },
          { name: 'Endpoint', value: type },
          { name: 'Current Count', value: current.toString() },
          { name: 'Threshold', value: thresholds.hourly.toString() }
        ],
        color: 0xFFA500,
        timestamp: new Date()
      };
      
      await sendDiscordAlert(alert);
      
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded',
        retryAfter: 3600,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
    
    next();
  } catch (error) {
    console.error('Advanced rate limiter error:', error);
    next();
  }
};

module.exports = advancedRateLimiter; 