const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');
const rateLimitMonitor = require('../services/rateLimitMonitor');

// Create Redis client
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Generic rate limiter creator
const createRateLimiter = (options) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: options.prefix || 'rl:'
    }),
    windowMs: options.windowMs || 15 * 60 * 1000, // Default: 15 minutes
    max: options.max || 100, // Default: 100 requests per windowMs
    message: options.message || 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use both IP and user ID (if available) to prevent abuse
      return `${req.ip}-${req.user?.id || 'anonymous'}`;
    },
    handler: async (req, res) => {
      // Record the violation
      await rateLimitMonitor.recordViolation(
        options.type || 'unknown',
        req.ip,
        req.user?.id || 'anonymous'
      );

      // Check if IP is blocked
      const isBlocked = await rateLimitMonitor.isIPBlocked(req.ip);
      if (isBlocked) {
        return res.status(403).json({
          message: 'Access denied. Your IP has been blocked due to suspicious activity.',
          blocked: true,
          type: 'IP_BLOCKED'
        });
      }

      // Send rate limit exceeded response
      res.status(429).json({
        message: options.message || 'Too many requests, please try again later.',
        type: options.type,
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// 2FA setup rate limiter (5 attempts per hour)
const setup2FALimiter = createRateLimiter({
  prefix: 'rl:2fa:setup:',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  type: '2fa_setup',
  message: 'Too many 2FA setup attempts. Please try again in an hour.'
});

// 2FA verification rate limiter (10 attempts per 15 minutes)
const verify2FALimiter = createRateLimiter({
  prefix: 'rl:2fa:verify:',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  type: '2fa_verify',
  message: 'Too many verification attempts. Please try again in 15 minutes.'
});

// Backup codes rate limiter (3 attempts per hour)
const backupCodesLimiter = createRateLimiter({
  prefix: 'rl:2fa:backup:',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  type: '2fa_backup',
  message: 'Too many backup code attempts. Please try again in an hour.'
});

// Recovery token rate limiter (3 attempts per day)
const recoveryTokenLimiter = createRateLimiter({
  prefix: 'rl:2fa:recovery:',
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3,
  type: '2fa_recovery',
  message: 'Too many recovery attempts. Please try again in 24 hours.'
});

// Disable 2FA rate limiter (5 attempts per hour)
const disable2FALimiter = createRateLimiter({
  prefix: 'rl:2fa:disable:',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  type: '2fa_disable',
  message: 'Too many 2FA disable attempts. Please try again in an hour.'
});

module.exports = {
  setup2FALimiter,
  verify2FALimiter,
  backupCodesLimiter,
  recoveryTokenLimiter,
  disable2FALimiter
}; 