const express = require('express');
const router = express.Router();
const dashboardAccessController = require('../controllers/dashboardAccessController');
const { authenticateAdmin } = require('../middleware/auth');
const checkDashboardPermission = require('../middleware/checkDashboardPermission');

// Apply admin authentication middleware to all routes
router.use(authenticateAdmin);

// Apply manageAccess permission check to all routes
router.use(checkDashboardPermission('manageAccess'));

// Get all users with dashboard access
router.get('/', dashboardAccessController.getAccessList);

// Grant dashboard access to a user
router.post('/', dashboardAccessController.grantAccess);

// Update user's dashboard permissions
router.put('/:userId', dashboardAccessController.updatePermissions);

// Revoke dashboard access
router.delete('/:userId', dashboardAccessController.revokeAccess);

// Check if user has specific permission
router.get('/:userId/permission', dashboardAccessController.checkPermission);

module.exports = router; 