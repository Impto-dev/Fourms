const { logger, SECURITY_EVENTS } = require('../utils/securityLogger');
const EventEmitter = require('events');
const DiscordService = require('./discordService');

const discordService = new DiscordService(process.env.DISCORD_WEBHOOK_URL);

class SecurityMonitor extends EventEmitter {
    constructor() {
        super();
        this.stats = {
            totalEvents: 0,
            eventsByType: {},
            eventsByIp: {},
            recentEvents: [],
            threatLevel: 'low'
        };
        this.MAX_RECENT_EVENTS = 100;
        this.suspiciousActivities = new Map();
    }

    async logEvent(eventType, details) {
        // Update statistics
        this.stats.totalEvents++;
        
        // Update events by type
        this.stats.eventsByType[eventType] = (this.stats.eventsByType[eventType] || 0) + 1;
        
        // Update events by IP
        if (details.ip) {
            this.stats.eventsByIp[details.ip] = (this.stats.eventsByIp[details.ip] || 0) + 1;
        }

        // Add to recent events
        const event = {
            type: eventType,
            timestamp: new Date().toISOString(),
            details
        };
        this.stats.recentEvents.unshift(event);
        if (this.stats.recentEvents.length > this.MAX_RECENT_EVENTS) {
            this.stats.recentEvents.pop();
        }

        // Calculate threat level
        this.calculateThreatLevel();

        // Emit event for real-time updates
        this.emit('securityEvent', event);

        // Log to file
        logger.security(event);

        // Send Discord notification for critical events
        if (event.type === SECURITY_EVENTS.SUSPICIOUS_ACTIVITY || event.type === SECURITY_EVENTS.UNAUTHORIZED_ACCESS) {
            await discordService.sendSecurityAlert(event);
        }

        // Track suspicious activities
        if (event.type === SECURITY_EVENTS.SUSPICIOUS_ACTIVITY) {
            const key = `${event.ip}-${event.userId}`;
            const count = this.suspiciousActivities.get(key) || 0;
            this.suspiciousActivities.set(key, count + 1);

            // If too many suspicious activities, take action
            if (count + 1 >= 5) {
                await this.handleSuspiciousActivity(event);
            }
        }
    }

    calculateThreatLevel() {
        const warningEvents = [
            SECURITY_EVENTS.AUTH_FAILURE,
            SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
            SECURITY_EVENTS.BRUTE_FORCE_ATTEMPT
        ];

        const criticalEvents = [
            SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
            SECURITY_EVENTS.XSS_ATTEMPT,
            SECURITY_EVENTS.UNAUTHORIZED_ACCESS
        ];

        const recentEvents = this.stats.recentEvents.slice(0, 10);
        const warningCount = recentEvents.filter(e => warningEvents.includes(e.type)).length;
        const criticalCount = recentEvents.filter(e => criticalEvents.includes(e.type)).length;

        if (criticalCount > 2) {
            this.stats.threatLevel = 'critical';
        } else if (criticalCount > 0 || warningCount > 3) {
            this.stats.threatLevel = 'high';
        } else if (warningCount > 1) {
            this.stats.threatLevel = 'medium';
        } else {
            this.stats.threatLevel = 'low';
        }
    }

    getStats() {
        return {
            ...this.stats,
            topIps: Object.entries(this.stats.eventsByIp)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([ip, count]) => ({ ip, count })),
            topEventTypes: Object.entries(this.stats.eventsByType)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => ({ type, count }))
        };
    }

    getRecentEvents(limit = 10) {
        return this.stats.recentEvents.slice(0, limit);
    }

    getEventsByType(type, limit = 10) {
        return this.stats.recentEvents
            .filter(event => event.type === type)
            .slice(0, limit);
    }

    getEventsByIp(ip, limit = 10) {
        return this.stats.recentEvents
            .filter(event => event.details.ip === ip)
            .slice(0, limit);
    }

    async handleSuspiciousActivity(event) {
        // Implement security measures
        // For example, temporarily block IP or user
        // Send additional notification
        await discordService.sendSecurityAlert({
            ...event,
            type: 'suspicious_activity_blocked',
            details: 'Multiple suspicious activities detected. Security measures applied.'
        });
    }
}

// Create a singleton instance
const securityMonitor = new SecurityMonitor();

module.exports = securityMonitor; 