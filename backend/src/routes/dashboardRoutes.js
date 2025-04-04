const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateAdmin } = require('../middleware/auth');

// Apply admin authentication middleware to all dashboard routes
router.use(authenticateAdmin);

// Get overall violation statistics
router.get('/stats', dashboardController.getViolationStats);

// Get detailed violation history
router.get('/violations', dashboardController.getViolationHistory);

// Get IP-specific statistics
router.get('/ip/:ip', dashboardController.getIPStats);

// Unblock an IP address
router.post('/ip/:ip/unblock', dashboardController.unblockIP);

// Update rate limit thresholds
router.put('/thresholds', dashboardController.updateThresholds);

module.exports = router; 