const winston = require('winston');
const path = require('path');
const fs = require('fs');
const securityMonitor = require('../services/securityMonitor');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Create a logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // Write all logs to security.log
        new winston.transports.File({ 
            filename: path.join(logDir, 'security.log'),
            level: 'info'
        }),
        // Write errors to security-error.log
        new winston.transports.File({ 
            filename: path.join(logDir, 'security-error.log'),
            level: 'error'
        })
    ]
});

// If we're not in production, log to console as well
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Security event types
const SECURITY_EVENTS = {
    LOGIN_ATTEMPT: 'LOGIN_ATTEMPT',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    PASSWORD_RESET: 'PASSWORD_RESET',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    BRUTE_FORCE_ATTEMPT: 'BRUTE_FORCE_ATTEMPT',
    TOKEN_REVOKED: 'TOKEN_REVOKED',
    IP_BLOCKED: 'IP_BLOCKED',
    PAYMENT_ATTEMPT: 'PAYMENT_ATTEMPT',
    PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
    PAYMENT_FAILURE: 'PAYMENT_FAILURE'
};

// Log security event
const logSecurityEvent = (eventType, details) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        eventType,
        ...details
    };

    logger.info('Security Event', logEntry);

    // Send critical events to Discord
    if (['SUSPICIOUS_ACTIVITY', 'BRUTE_FORCE_ATTEMPT', 'IP_BLOCKED'].includes(eventType)) {
        // Implement Discord webhook notification here
    }

    // Send to security monitor
    securityMonitor.logEvent(eventType, details);
};

module.exports = {
    logger,
    SECURITY_EVENTS,
    logSecurityEvent
}; 