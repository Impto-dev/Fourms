const { SECURITY_EVENTS, logSecurityEvent } = require('../utils/securityLogger');

const suspiciousActivity = (req, res, next) => {
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    const userId = req.user ? req.user._id : null;

    // Check for suspicious patterns in request
    const checkSuspiciousPatterns = () => {
        const suspiciousPatterns = [
            /<script>/i,
            /eval\(/i,
            /document\./i,
            /window\./i,
            /alert\(/i,
            /onerror=/i,
            /onload=/i,
            /javascript:/i,
            /data:/i,
            /vbscript:/i
        ];

        // Check request body
        if (req.body) {
            const bodyString = JSON.stringify(req.body);
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(bodyString)) {
                    return true;
                }
            }
        }

        // Check query parameters
        if (req.query) {
            const queryString = JSON.stringify(req.query);
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(queryString)) {
                    return true;
                }
            }
        }

        return false;
    };

    // Check for rapid consecutive requests
    const checkRapidRequests = () => {
        // This would typically be implemented with a rate limiting service
        // For now, we'll just log the check
        return false;
    };

    // Check for suspicious user agent
    const checkSuspiciousUserAgent = () => {
        const suspiciousUserAgents = [
            /curl/i,
            /wget/i,
            /python/i,
            /perl/i,
            /ruby/i,
            /java/i,
            /php/i,
            /sqlmap/i,
            /nikto/i,
            /nmap/i
        ];

        for (const pattern of suspiciousUserAgents) {
            if (pattern.test(userAgent)) {
                return true;
            }
        }

        return false;
    };

    // Perform checks
    if (checkSuspiciousPatterns()) {
        logSecurityEvent(SECURITY_EVENTS.XSS_ATTEMPT, {
            ip,
            userAgent,
            userId,
            message: 'Potential XSS attempt detected'
        });
        return res.status(403).json({
            success: false,
            error: 'Suspicious activity detected'
        });
    }

    if (checkSuspiciousUserAgent()) {
        logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
            ip,
            userAgent,
            userId,
            message: 'Suspicious user agent detected'
        });
        return res.status(403).json({
            success: false,
            error: 'Suspicious activity detected'
        });
    }

    if (checkRapidRequests()) {
        logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
            ip,
            userAgent,
            userId,
            message: 'Rapid consecutive requests detected'
        });
        return res.status(429).json({
            success: false,
            error: 'Too many requests'
        });
    }

    next();
};

module.exports = suspiciousActivity; 