const Thread = require('../models/Thread');
const Post = require('../models/Post');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');

// Create new thread
exports.createThread = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, category, tags } = req.body;

        // Check if category exists
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Create thread
        const thread = new Thread({
            title,
            content,
            author: req.user._id,
            category,
            tags
        });

        await thread.save();

        // Create first post
        const post = new Post({
            content,
            author: req.user._id,
            thread: thread._id
        });

        await post.save();

        // Update thread with first post
        thread.lastPost = post._id;
        thread.lastPostBy = req.user._id;
        thread.lastPostAt = new Date();
        await thread.save();

        // Update category counts
        await categoryExists.updateCounts();
        await categoryExists.updateLastPost();

        res.status(201).json(thread);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all threads
exports.getThreads = async (req, res) => {
    try {
        const { category, page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const query = {};
        if (category) {
            query.category = category;
        }

        const threads = await Thread.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'username')
            .populate('category', 'name')
            .populate('lastPostBy', 'username');

        const total = await Thread.countDocuments(query);

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

// Get single thread
exports.getThread = async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id)
            .populate('author', 'username')
            .populate('category', 'name')
            .populate('lastPostBy', 'username');

        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Increment views
        await thread.incrementViews();

        res.json(thread);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update thread
exports.updateThread = async (req, res) => {
    try {
        const { title, content, category, tags, status } = req.body;

        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Check if user is author or admin
        if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update thread
        thread.title = title || thread.title;
        thread.content = content || thread.content;
        thread.category = category || thread.category;
        thread.tags = tags || thread.tags;
        thread.status = status || thread.status;
        await thread.save();

        res.json(thread);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete thread
exports.deleteThread = async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Check if user is author or admin
        if (thread.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete all posts in thread
        await Post.deleteMany({ thread: thread._id });

        // Delete thread
        await thread.remove();

        // Update category counts
        const category = await Category.findById(thread.category);
        if (category) {
            await category.updateCounts();
            await category.updateLastPost();
        }

        res.json({ message: 'Thread deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Like thread
exports.likeThread = async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        await thread.toggleLike(req.user._id);
        res.json(thread);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Search threads
exports.searchThreads = async (req, res) => {
    try {
        const { query, page = 1, limit = 10 } = req.query;

        const threads = await Thread.find(
            { $text: { $search: query } },
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'username')
            .populate('category', 'name');

        const total = await Thread.countDocuments({ $text: { $search: query } });

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