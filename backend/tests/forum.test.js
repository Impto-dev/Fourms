const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const User = require('../src/models/User');
const Thread = require('../src/models/Thread');
const Post = require('../src/models/Post');

// Test data
const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!'
};

let authToken;

// Before all tests
beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI + '_test');
});

// After all tests
afterAll(async () => {
    // Clean up test database
    await User.deleteMany({});
    await Thread.deleteMany({});
    await Post.deleteMany({});
    await mongoose.connection.close();
});

// Before each test
beforeEach(async () => {
    // Clear the database
    await User.deleteMany({});
    await Thread.deleteMany({});
    await Post.deleteMany({});

    // Register and login a user
    await request(app)
        .post('/api/auth/register')
        .send(testUser);

    const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
            email: testUser.email,
            password: testUser.password
        });

    authToken = loginResponse.body.token;
});

describe('Forum API', () => {
    describe('Thread Management', () => {
        it('should create a new thread', async () => {
            const threadData = {
                title: 'Test Thread',
                content: 'This is a test thread',
                category: 'general'
            };

            const response = await request(app)
                .post('/api/threads')
                .set('Authorization', `Bearer ${authToken}`)
                .send(threadData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.thread).toHaveProperty('title', threadData.title);
            expect(response.body.thread).toHaveProperty('author');
        });

        it('should get all threads', async () => {
            // Create a test thread first
            await request(app)
                .post('/api/threads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Thread',
                    content: 'This is a test thread',
                    category: 'general'
                });

            const response = await request(app)
                .get('/api/threads')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.threads)).toBe(true);
            expect(response.body.threads.length).toBeGreaterThan(0);
        });

        it('should get a single thread', async () => {
            // Create a test thread first
            const createResponse = await request(app)
                .post('/api/threads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Thread',
                    content: 'This is a test thread',
                    category: 'general'
                });

            const threadId = createResponse.body.thread._id;

            const response = await request(app)
                .get(`/api/threads/${threadId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.thread).toHaveProperty('title', 'Test Thread');
        });
    });

    describe('Post Management', () => {
        let threadId;

        beforeEach(async () => {
            // Create a test thread
            const createResponse = await request(app)
                .post('/api/threads')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Thread',
                    content: 'This is a test thread',
                    category: 'general'
                });

            threadId = createResponse.body.thread._id;
        });

        it('should create a new post', async () => {
            const postData = {
                content: 'This is a test post',
                threadId: threadId
            };

            const response = await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(postData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.post).toHaveProperty('content', postData.content);
        });

        it('should get all posts for a thread', async () => {
            // Create a test post first
            await request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    content: 'This is a test post',
                    threadId: threadId
                });

            const response = await request(app)
                .get(`/api/posts?threadId=${threadId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.posts)).toBe(true);
            expect(response.body.posts.length).toBeGreaterThan(0);
        });
    });
}); 