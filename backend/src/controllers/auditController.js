const auditService = require('../services/auditService');

// Get audit logs with filters
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, ...filters } = req.query;
    
    const result = await auditService.getAuditLogs(filters, parseInt(page), parseInt(limit));
    
    res.json(result);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

// Generate compliance report
exports.generateComplianceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const report = await auditService.generateComplianceReport(startDate, endDate);
    
    res.json(report);
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
};

// Clean up old audit logs
exports.cleanupOldLogs = async (req, res) => {
  try {
    const result = await auditService.cleanupOldLogs();
    
    res.json({
      message: 'Old audit logs cleaned up successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up old audit logs:', error);
    res.status(500).json({ error: 'Failed to clean up old audit logs' });
  }
};

// Get audit log by ID
exports.getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await auditService.getAuditLogById(id);
    
    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }
    
    res.json(log);
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
};

// Get audit logs by user
exports.getAuditLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await auditService.getAuditLogs(
      { userId },
      parseInt(page),
      parseInt(limit)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error getting user audit logs:', error);
    res.status(500).json({ error: 'Failed to get user audit logs' });
  }
};

// Get audit logs by entity
exports.getAuditLogsByEntity = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const result = await auditService.getAuditLogs(
      { entityType, entityId },
      parseInt(page),
      parseInt(limit)
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error getting entity audit logs:', error);
    res.status(500).json({ error: 'Failed to get entity audit logs' });
  }
}; 