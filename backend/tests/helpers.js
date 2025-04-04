const User = require('../models/User');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');

/**
 * Create a test user
 * @returns {Promise<Object>} Test user
 */
const createTestUser = async () => {
    const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test123!',
        role: 'user'
    });
    await user.save();
    return user;
};

/**
 * Get authentication token for a user
 * @param {Object} user - User object
 * @returns {Promise<String>} JWT token
 */
const getAuthToken = async (user) => {
    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return token;
};

/**
 * Clean up test data
 * @returns {Promise<void>}
 */
const cleanupTestData = async () => {
    await User.deleteMany({});
};

/**
 * Creates a test thread for integration tests
 * @param {string} userId - ID of the user creating the thread
 * @returns {Promise<Thread>}
 */
const createTestThread = async (userId) => {
    const thread = new Thread({
        title: 'Test Thread',
        content: 'This is a test thread',
        author: userId,
        category: 'test'
    });
    await thread.save();
    return thread;
};

/**
 * Creates a test post for integration tests
 * @param {string} userId - ID of the user creating the post
 * @param {string} threadId - ID of the thread the post belongs to
 * @returns {Promise<Post>}
 */
const createTestPost = async (userId, threadId) => {
    const post = new Post({
        content: 'This is a test post',
        author: userId,
        thread: threadId
    });
    await post.save();
    return post;
};

module.exports = {
    createTestUser,
    getAuthToken,
    cleanupTestData,
    createTestThread,
    createTestPost
}; 