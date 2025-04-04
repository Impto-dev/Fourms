const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Get audit logs with filters
router.get('/', 
  verifyToken, 
  checkPermission('viewAuditLogs'),
  auditController.getAuditLogs
);

// Generate compliance report
router.get('/compliance', 
  verifyToken, 
  checkPermission('generateReports'),
  auditController.generateComplianceReport
);

// Clean up old audit logs
router.delete('/cleanup', 
  verifyToken, 
  checkPermission('manageAuditLogs'),
  auditController.cleanupOldLogs
);

// Get audit log by ID
router.get('/:id', 
  verifyToken, 
  checkPermission('viewAuditLogs'),
  auditController.getAuditLogById
);

// Get audit logs by user
router.get('/user/:userId', 
  verifyToken, 
  checkPermission('viewAuditLogs'),
  auditController.getAuditLogsByUser
);

// Get audit logs by entity
router.get('/entity/:entityType/:entityId', 
  verifyToken, 
  checkPermission('viewAuditLogs'),
  auditController.getAuditLogsByEntity
);

module.exports = router; 