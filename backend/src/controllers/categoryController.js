const Category = require('../models/Category');
const { validationResult } = require('express-validator');

// Create new category
exports.createCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, parent, order, isPrivate, allowedRoles } = req.body;

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Check if category with same slug exists
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        // Create category
        const category = new Category({
            name,
            description,
            slug,
            parent,
            order,
            isPrivate,
            allowedRoles
        });

        await category.save();

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .sort({ order: 1, createdAt: 1 })
            .populate('parent', 'name')
            .populate('lastThread', 'title')
            .populate('lastPost', 'content');

        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single category
exports.getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'name')
            .populate('lastThread', 'title')
            .populate('lastPost', 'content');

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { name, description, parent, order, isPrivate, allowedRoles } = req.body;

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Generate new slug if name changed
        let slug = category.slug;
        if (name && name !== category.name) {
            slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            // Check if new slug exists
            const existingCategory = await Category.findOne({ slug, _id: { $ne: category._id } });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }
        }

        // Update category
        category.name = name || category.name;
        category.description = description || category.description;
        category.slug = slug;
        category.parent = parent || category.parent;
        category.order = order || category.order;
        category.isPrivate = isPrivate !== undefined ? isPrivate : category.isPrivate;
        category.allowedRoles = allowedRoles || category.allowedRoles;

        await category.save();

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if category has subcategories
        const subcategories = await Category.find({ parent: category._id });
        if (subcategories.length > 0) {
            return res.status(400).json({ message: 'Cannot delete category with subcategories' });
        }

        // Check if category has threads
        const Thread = mongoose.model('Thread');
        const threadCount = await Thread.countDocuments({ category: category._id });
        if (threadCount > 0) {
            return res.status(400).json({ message: 'Cannot delete category with threads' });
        }

        await category.remove();

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get category threads
exports.getCategoryThreads = async (req, res) => {
    try {
        const { page = 1, limit = 20, sort = '-createdAt' } = req.query;

        const threads = await Thread.find({ category: req.params.id })
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'username')
            .populate('lastPostBy', 'username');

        const total = await Thread.countDocuments({ category: req.params.id });

        res.json({
            threads,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 