const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const postController = require('../controllers/postController');
const { auth, authorize } = require('../middleware/auth');

// Validation middleware
const validatePost = [
    body('content')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters'),
    body('thread')
        .isMongoId()
        .withMessage('Invalid thread ID'),
    body('parentPost')
        .optional()
        .isMongoId()
        .withMessage('Invalid parent post ID')
];

// Routes
router.get('/', postController.getPosts);
router.get('/:id', postController.getPost);
router.get('/:id/history', postController.getPostHistory);

// Protected routes
router.post('/', auth, validatePost, postController.createPost);
router.put('/:id', auth, validatePost, postController.updatePost);
router.delete('/:id', auth, postController.deletePost);
router.post('/:id/like', auth, postController.likePost);

// Admin routes
router.put('/:id/status', auth, authorize('admin'), postController.updatePost);
router.delete('/:id/force', auth, authorize('admin'), postController.deletePost);

module.exports = router; 