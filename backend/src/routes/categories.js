const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { auth, authorize } = require('../middleware/auth');

// Validation middleware
const validateCategory = [
    body('name')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Name must be between 3 and 50 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be less than 500 characters'),
    body('parent')
        .optional()
        .isMongoId()
        .withMessage('Invalid parent category ID'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a positive integer'),
    body('isPrivate')
        .optional()
        .isBoolean()
        .withMessage('isPrivate must be a boolean'),
    body('allowedRoles')
        .optional()
        .isArray()
        .withMessage('allowedRoles must be an array')
];

// Routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);
router.get('/:id/threads', categoryController.getCategoryThreads);

// Protected routes (admin only)
router.post('/', auth, authorize('admin'), validateCategory, categoryController.createCategory);
router.put('/:id', auth, authorize('admin'), validateCategory, categoryController.updateCategory);
router.delete('/:id', auth, authorize('admin'), categoryController.deleteCategory);

module.exports = router; 