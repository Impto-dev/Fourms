const Post = require('../models/Post');
const Thread = require('../models/Thread');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');

// Create new post
exports.createPost = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { content, thread, parentPost } = req.body;

        // Check if thread exists
        const threadExists = await Thread.findById(thread);
        if (!threadExists) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Check if thread is locked
        if (threadExists.isLocked) {
            return res.status(403).json({ message: 'Thread is locked' });
        }

        // Create post
        const post = new Post({
            content,
            author: req.user._id,
            thread,
            parentPost
        });

        await post.save();

        // Update thread
        threadExists.lastPost = post._id;
        threadExists.lastPostBy = req.user._id;
        threadExists.lastPostAt = new Date();
        await threadExists.save();

        // Update category
        const category = await Category.findById(threadExists.category);
        if (category) {
            await category.updateCounts();
            await category.updateLastPost();
        }

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get posts in thread
exports.getPosts = async (req, res) => {
    try {
        const { thread, page = 1, limit = 20, sort = 'createdAt' } = req.query;

        const query = { thread };
        const posts = await Post.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'username')
            .populate('parentPost', 'content author');

        const total = await Post.countDocuments(query);

        res.json({
            posts,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get single post
exports.getPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username')
            .populate('parentPost', 'content author');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update post
exports.updatePost = async (req, res) => {
    try {
        const { content } = req.body;

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user is author or admin
        if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Update post
        await post.edit(content, req.user._id);

        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete post
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user is author or admin
        if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Soft delete
        post.status = 'deleted';
        await post.save();

        // Update thread and category
        const thread = await Thread.findById(post.thread);
        if (thread) {
            const lastPost = await Post.findOne({ thread: thread._id, status: 'published' })
                .sort({ createdAt: -1 });

            if (lastPost) {
                thread.lastPost = lastPost._id;
                thread.lastPostBy = lastPost.author;
                thread.lastPostAt = lastPost.createdAt;
            } else {
                thread.lastPost = null;
                thread.lastPostBy = null;
                thread.lastPostAt = null;
            }
            await thread.save();

            const category = await Category.findById(thread.category);
            if (category) {
                await category.updateCounts();
                await category.updateLastPost();
            }
        }

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Like post
exports.likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        await post.toggleLike(req.user._id);
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get post history
exports.getPostHistory = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post.editHistory);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 