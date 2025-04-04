const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           description: User's username
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         avatar:
 *           type: string
 *           description: URL to user's avatar
 *         bio:
 *           type: string
 *           description: User's biography
 *         preferences:
 *           type: object
 *           properties:
 *             notifications:
 *               type: boolean
 *               description: Email notification preference
 *             theme:
 *               type: string
 *               enum: [light, dark, system]
 *               description: UI theme preference
 */

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfile'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/profile', userController.updateProfile);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Change user's password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid current password
 *       500:
 *         description: Server error
 */
router.put('/change-password', userController.changePassword);

/**
 * @swagger
 * /users/notifications:
 *   get:
 *     summary: Get user's notifications
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of notifications
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/notifications', userController.getNotifications);

/**
 * @swagger
 * /users/notifications/{id}:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/notifications/:id', userController.markNotificationAsRead);

/**
 * @swagger
 * /users/preferences:
 *   get:
 *     summary: Get user's preferences
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User preferences
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/preferences', userController.getPreferences);

/**
 * @swagger
 * /users/preferences:
 *   put:
 *     summary: Update user's preferences
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: boolean
 *                 description: Email notification preference
 *               theme:
 *                 type: string
 *                 enum: [light, dark, system]
 *                 description: UI theme preference
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/preferences', userController.updatePreferences);

module.exports = router; 