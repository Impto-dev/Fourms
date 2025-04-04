const express = require('express');
const router = express.Router();
const securityAnalyticsController = require('../controllers/securityAnalyticsController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Track security event
router.post('/track', 
  verifyToken, 
  checkPermission('manageSecurity'),
  securityAnalyticsController.trackEvent
);

// Get risk score for an IP
router.get('/risk-score', 
  verifyToken, 
  checkPermission('view'),
  securityAnalyticsController.getRiskScore
);

// Get events by IP
router.get('/events', 
  verifyToken, 
  checkPermission('view'),
  securityAnalyticsController.getEventsByIP
);

// Get security statistics
router.get('/statistics', 
  verifyToken, 
  checkPermission('view'),
  securityAnalyticsController.getStatistics
);

module.exports = router; 