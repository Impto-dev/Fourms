const express = require('express');
const router = express.Router();
const dashboardAuthController = require('../controllers/dashboardAuthController');
const dashboardAuth = require('../middleware/dashboardAuth');
const { authenticateAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', dashboardAuthController.login);

// Protected routes (require dashboard authentication)
router.use(dashboardAuth);

// Get current user
router.get('/me', (req, res) => {
  res.json(req.dashboardUser);
});

// Admin-only routes (require both dashboard auth and admin privileges)
router.use(authenticateAdmin);

// Dashboard user management
router.post('/users', dashboardAuthController.createUser);
router.get('/users', dashboardAuthController.getUsers);
router.put('/users/:userId', dashboardAuthController.updateUser);
router.delete('/users/:userId', dashboardAuthController.deleteUser);

module.exports = router; 