const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/securityLogger');

const sessionManager = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.id, 'tokens.token': token });

    if (!user) {
      throw new Error();
    }

    // Check if token is blacklisted
    if (user.blacklistedTokens.includes(token)) {
      logger.warn('Blacklisted token attempt', {
        userId: user._id,
        ip: req.ip
      });
      throw new Error('Token has been revoked');
    }

    // Check for suspicious login patterns
    const lastLogin = user.lastLogin;
    const currentLogin = new Date();
    const timeDiff = (currentLogin - lastLogin) / (1000 * 60 * 60); // hours

    if (timeDiff < 1 && req.ip !== user.lastLoginIp) {
      logger.warn('Suspicious login pattern detected', {
        userId: user._id,
        lastLoginIp: user.lastLoginIp,
        currentIp: req.ip,
        timeDiff
      });
    }

    // Update last login info
    user.lastLogin = currentLogin;
    user.lastLoginIp = req.ip;
    await user.save();

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    logger.error('Session management error', {
      error: error.message,
      ip: req.ip
    });
    res.status(401).json({ error: 'Please authenticate' });
  }
};

module.exports = sessionManager; 