const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const threadController = require('../controllers/threadController');
const { auth, authorize } = require('../middleware/auth');

// Validation middleware
const validateThread = [
    body('title')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('content')
        .trim()
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters'),
    body('category')
        .isMongoId()
        .withMessage('Invalid category ID'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array')
];

// Routes
router.get('/', threadController.getThreads);
router.get('/search', threadController.searchThreads);
router.get('/:id', threadController.getThread);

// Protected routes
router.post('/', auth, validateThread, threadController.createThread);
router.put('/:id', auth, validateThread, threadController.updateThread);
router.delete('/:id', auth, threadController.deleteThread);
router.post('/:id/like', auth, threadController.likeThread);

// Admin routes
router.put('/:id/status', auth, authorize('admin'), threadController.updateThread);
router.put('/:id/sticky', auth, authorize('admin'), threadController.updateThread);
router.put('/:id/lock', auth, authorize('admin'), threadController.updateThread);

module.exports = router; 