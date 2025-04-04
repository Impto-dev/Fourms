const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Moderation
 *   description: Content moderation endpoints
 */

// Apply authentication middleware to all routes
router.use(authenticate);

// Apply moderator authorization to all routes
router.use(authorize('moderator'));

/**
 * @swagger
 * /moderation/analyze:
 *   post:
 *     summary: Analyze content for moderation
 *     tags: [Moderation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Content to analyze
 *     responses:
 *       200:
 *         description: Content analysis results
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/analyze', moderationController.analyzeContent);

/**
 * @swagger
 * /moderation/queue:
 *   get:
 *     summary: Get moderation queue
 *     tags: [Moderation]
 *     responses:
 *       200:
 *         description: List of content awaiting moderation
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/queue', moderationController.getModerationQueue);

/**
 * @swagger
 * /moderation/bulk:
 *   post:
 *     summary: Perform bulk moderation actions
 *     tags: [Moderation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentIds
 *               - action
 *             properties:
 *               contentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of content IDs to moderate
 *               action:
 *                 type: string
 *                 enum: [approve, reject, delete]
 *                 description: Action to perform
 *     responses:
 *       200:
 *         description: Bulk moderation results
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/bulk', moderationController.bulkModerate);

/**
 * @swagger
 * /moderation/threads/{threadId}:
 *   post:
 *     summary: Moderate a specific thread
 *     tags: [Moderation]
 *     parameters:
 *       - in: path
 *         name: threadId
 *         required: true
 *         schema:
 *           type: string
 *         description: Thread ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, delete]
 *                 description: Action to perform
 *     responses:
 *       200:
 *         description: Thread moderation result
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Thread not found
 */
router.post('/threads/:threadId', moderationController.moderateThread);

/**
 * @swagger
 * /moderation/posts/{postId}:
 *   post:
 *     summary: Moderate a specific post
 *     tags: [Moderation]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, delete]
 *                 description: Action to perform
 *     responses:
 *       200:
 *         description: Post moderation result
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 */
router.post('/posts/:postId', moderationController.moderatePost);

/**
 * @swagger
 * /moderation/stats:
 *   get:
 *     summary: Get moderation statistics
 *     tags: [Moderation]
 *     responses:
 *       200:
 *         description: Moderation statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/stats', moderationController.getModerationStats);

module.exports = router; 