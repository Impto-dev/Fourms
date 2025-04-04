const mongoose = require('mongoose');
const { sendDiscordAlert } = require('./discordService');

const auditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'create',
      'update',
      'delete',
      'permission_change',
      'system_change',
      'security_event'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: [
      'user',
      'thread',
      'post',
      'category',
      'permission',
      'system',
      'security'
    ]
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditSchema.index({ userId: 1, timestamp: -1 });
auditSchema.index({ action: 1, timestamp: -1 });
auditSchema.index({ entityType: 1, entityId: 1 });
auditSchema.index({ ip: 1, timestamp: -1 });

const Audit = mongoose.model('Audit', auditSchema);

class AuditService {
  constructor() {
    this.retentionPeriod = 90; // days
  }

  // Log an audit event
  async logEvent(userId, action, entityType, entityId, details, ip, metadata = {}) {
    try {
      const audit = new Audit({
        userId,
        action,
        entityType,
        entityId,
        details,
        ip,
        metadata
      });

      await audit.save();

      // Send alert for critical events
      if (this.isCriticalEvent(action, entityType)) {
        await this.sendAlert(audit);
      }

      return audit;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  }

  // Check if event is critical
  isCriticalEvent(action, entityType) {
    const criticalActions = ['permission_change', 'system_change', 'security_event'];
    const criticalEntities = ['permission', 'system', 'security'];
    
    return criticalActions.includes(action) || criticalEntities.includes(entityType);
  }

  // Send alert for critical events
  async sendAlert(audit) {
    const alert = {
      title: '🔍 Critical Audit Event',
      description: 'A critical audit event has been logged',
      fields: [
        { name: 'Action', value: audit.action },
        { name: 'Entity Type', value: audit.entityType },
        { name: 'IP Address', value: audit.ip },
        { name: 'Details', value: JSON.stringify(audit.details, null, 2) }
      ],
      color: 0xFFA500,
      timestamp: audit.timestamp
    };

    await sendDiscordAlert(alert);
  }

  // Get audit logs with filters
  async getAuditLogs(filters = {}, page = 1, limit = 50) {
    try {
      const query = this.buildQuery(filters);
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        Audit.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'username email')
          .lean(),
        Audit.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  // Build query from filters
  buildQuery(filters) {
    const query = {};
    
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;
    if (filters.ip) query.ip = filters.ip;
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }
    
    return query;
  }

  // Generate compliance report
  async generateComplianceReport(startDate, endDate) {
    try {
      const query = {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };

      const logs = await Audit.find(query)
        .populate('userId', 'username email')
        .lean();

      const report = {
        period: { startDate, endDate },
        totalEvents: logs.length,
        eventsByType: {},
        eventsByUser: {},
        criticalEvents: 0
      };

      logs.forEach(log => {
        // Count by type
        report.eventsByType[log.entityType] = (report.eventsByType[log.entityType] || 0) + 1;
        
        // Count by user
        const userId = log.userId._id.toString();
        report.eventsByUser[userId] = {
          username: log.userId.username,
          count: (report.eventsByUser[userId]?.count || 0) + 1
        };
        
        // Count critical events
        if (this.isCriticalEvent(log.action, log.entityType)) {
          report.criticalEvents++;
        }
      });

      return report;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  // Clean up old audit logs
  async cleanupOldLogs() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionPeriod);

      const result = await Audit.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      return result;
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService(); 