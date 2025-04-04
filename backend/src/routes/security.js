const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const securityMonitor = require('../services/securityMonitor');

// Get security dashboard statistics
router.get('/stats', protect, isAdmin, (req, res) => {
    try {
        const stats = securityMonitor.getStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get security statistics'
        });
    }
});

// Get recent security events
router.get('/events', protect, isAdmin, (req, res) => {
    try {
        const { limit = 10, type, ip } = req.query;
        let events;

        if (type) {
            events = securityMonitor.getEventsByType(type, parseInt(limit));
        } else if (ip) {
            events = securityMonitor.getEventsByIp(ip, parseInt(limit));
        } else {
            events = securityMonitor.getRecentEvents(parseInt(limit));
        }

        res.json({
            success: true,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get security events'
        });
    }
});

// Get real-time security events via SSE
router.get('/events/stream', protect, isAdmin, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial data
    const stats = securityMonitor.getStats();
    res.write(`data: ${JSON.stringify({ type: 'initial', data: stats })}\n\n`);

    // Listen for new events
    const eventHandler = (event) => {
        res.write(`data: ${JSON.stringify({ type: 'event', data: event })}\n\n`);
    };

    securityMonitor.on('securityEvent', eventHandler);

    // Clean up on client disconnect
    req.on('close', () => {
        securityMonitor.removeListener('securityEvent', eventHandler);
    });
});

module.exports = router; 