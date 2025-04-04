const express = require('express');
const router = express.Router();
const advancedRateLimitController = require('../controllers/advancedRateLimitController');
const { verifyToken, checkPermission } = require('../middleware/auth');

// Get current rate limit thresholds
router.get('/thresholds', 
  verifyToken, 
  checkPermission('manageThresholds'),
  advancedRateLimitController.getThresholds
);

// Update rate limit thresholds
router.post('/thresholds', 
  verifyToken, 
  checkPermission('manageThresholds'),
  advancedRateLimitController.updateThresholds
);

// Block IP based on geographic location
router.post('/block', 
  verifyToken, 
  checkPermission('manageIPs'),
  advancedRateLimitController.blockGeographicIP
);

// Get IP pattern analysis
router.get('/pattern', 
  verifyToken, 
  checkPermission('view'),
  advancedRateLimitController.getPatternAnalysis
);

// Get geographic block status
router.get('/block-status', 
  verifyToken, 
  checkPermission('view'),
  advancedRateLimitController.getGeographicBlockStatus
);

module.exports = router; 