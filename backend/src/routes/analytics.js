const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Analytics and statistics endpoints
 */

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply admin authorization to all routes
router.use(authorize('admin'));

/**
 * @swagger
 * /analytics/user-activity:
 *   get:
 *     summary: Get user activity statistics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d]
 *         description: Time range for statistics
 *     responses:
 *       200:
 *         description: User activity statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/user-activity', analyticsController.getUserActivity);

/**
 * @swagger
 * /analytics/content-stats:
 *   get:
 *     summary: Get content statistics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d]
 *         description: Time range for statistics
 *     responses:
 *       200:
 *         description: Content statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/content-stats', analyticsController.getContentStatistics);

/**
 * @swagger
 * /analytics/performance:
 *   get:
 *     summary: Get system performance metrics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Performance metrics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/performance', analyticsController.getPerformanceMetrics);

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get combined dashboard data
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1d, 7d, 30d, 90d]
 *         description: Time range for statistics
 *     responses:
 *       200:
 *         description: Combined dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/dashboard', analyticsController.getDashboardData);

module.exports = router; 