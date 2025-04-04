const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Forum
 *   description: Forum management endpoints
 */

/**
 * @swagger
 * /threads:
 *   get:
 *     summary: Get all threads
 *     tags: [Forum]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: List of threads
 *       500:
 *         description: Server error
 */
router.get('/threads', forumController.getThreads);

/**
 * @swagger
 * /threads/{id}:
 *   get:
 *     summary: Get a specific thread
 *     tags: [Forum]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Thread details
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Server error
 */
router.get('/threads/:id', forumController.getThread);

/**
 * @swagger
 * /threads:
 *   post:
 *     summary: Create a new thread
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 description: Thread title
 *               content:
 *                 type: string
 *                 description: Thread content
 *               category:
 *                 type: string
 *                 description: Thread category
 *     responses:
 *       201:
 *         description: Thread created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/threads', authenticate, forumController.createThread);

/**
 * @swagger
 * /threads/{id}:
 *   put:
 *     summary: Update a thread
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated thread title
 *               content:
 *                 type: string
 *                 description: Updated thread content
 *               category:
 *                 type: string
 *                 description: Updated thread category
 *     responses:
 *       200:
 *         description: Thread updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Server error
 */
router.put('/threads/:id', authenticate, forumController.updateThread);

/**
 * @swagger
 * /threads/{id}:
 *   delete:
 *     summary: Delete a thread
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Thread ID
 *     responses:
 *       200:
 *         description: Thread deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Server error
 */
router.delete('/threads/:id', authenticate, forumController.deleteThread);

/**
 * @swagger
 * /threads/{id}/posts:
 *   get:
 *     summary: Get posts for a thread
 *     tags: [Forum]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Thread ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of posts
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Server error
 */
router.get('/threads/:id/posts', forumController.getPosts);

/**
 * @swagger
 * /threads/{id}/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Post content
 *     responses:
 *       201:
 *         description: Post created successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Thread not found
 *       500:
 *         description: Server error
 */
router.post('/threads/:id/posts', authenticate, forumController.createPost);

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Updated post content
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.put('/posts/:id', authenticate, forumController.updatePost);

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Post not found
 *       500:
 *         description: Server error
 */
router.delete('/posts/:id', authenticate, forumController.deletePost);

module.exports = router; 