const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const app = require('../app');
const User = require('../models/User');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const { createTestUser, createTestThread, createTestPost } = require('./helpers');

chai.use(chaiHttp);

describe('API Integration Tests', () => {
    let testUser;
    let testUserToken;
    let testThread;
    let testPost;

    before(async () => {
        // Create test user
        testUser = await createTestUser();
        testUserToken = testUser.generateAuthToken();

        // Create test thread
        testThread = await createTestThread(testUser._id);

        // Create test post
        testPost = await createTestPost(testUser._id, testThread._id);
    });

    after(async () => {
        // Clean up test data
        await User.deleteMany({ email: /test/ });
        await Thread.deleteMany({ title: /test/ });
        await Post.deleteMany({ content: /test/ });
    });

    describe('Authentication Flow', () => {
        it('should register a new user', async () => {
            const res = await chai.request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'test2@example.com',
                    password: 'Test123!'
                });

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('token');
            expect(res.body.user).to.have.property('email', 'test2@example.com');
        });

        it('should login with valid credentials', async () => {
            const res = await chai.request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123!'
                });

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('token');
        });

        it('should not login with invalid credentials', async () => {
            const res = await chai.request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res).to.have.status(401);
        });
    });

    describe('Thread Management', () => {
        it('should create a new thread', async () => {
            const res = await chai.request(app)
                .post('/api/threads')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    title: 'Integration Test Thread',
                    content: 'This is a test thread created during integration testing',
                    category: 'test'
                });

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('title', 'Integration Test Thread');
        });

        it('should get thread details', async () => {
            const res = await chai.request(app)
                .get(`/api/threads/${testThread._id}`)
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('title', testThread.title);
        });

        it('should update thread', async () => {
            const res = await chai.request(app)
                .put(`/api/threads/${testThread._id}`)
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    title: 'Updated Test Thread'
                });

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('title', 'Updated Test Thread');
        });
    });

    describe('Post Management', () => {
        it('should create a new post', async () => {
            const res = await chai.request(app)
                .post('/api/posts')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    content: 'Integration Test Post',
                    threadId: testThread._id
                });

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('content', 'Integration Test Post');
        });

        it('should get post details', async () => {
            const res = await chai.request(app)
                .get(`/api/posts/${testPost._id}`)
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('content', testPost.content);
        });

        it('should update post', async () => {
            const res = await chai.request(app)
                .put(`/api/posts/${testPost._id}`)
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    content: 'Updated Test Post'
                });

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('content', 'Updated Test Post');
        });
    });

    describe('User Profile Management', () => {
        it('should get user profile', async () => {
            const res = await chai.request(app)
                .get(`/api/users/${testUser._id}`)
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('email', testUser.email);
        });

        it('should update user profile', async () => {
            const res = await chai.request(app)
                .put(`/api/users/${testUser._id}`)
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    bio: 'Test bio update'
                });

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('bio', 'Test bio update');
        });
    });

    describe('Moderation Actions', () => {
        it('should report a post', async () => {
            const res = await chai.request(app)
                .post('/api/moderation/reports')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    postId: testPost._id,
                    reason: 'Test report',
                    details: 'This is a test report'
                });

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('status', 'pending');
        });

        it('should get moderation queue', async () => {
            const res = await chai.request(app)
                .get('/api/moderation/queue')
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
        });
    });

    describe('Analytics Endpoints', () => {
        it('should get forum statistics', async () => {
            const res = await chai.request(app)
                .get('/api/analytics/stats')
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('totalUsers');
            expect(res.body).to.have.property('totalThreads');
            expect(res.body).to.have.property('totalPosts');
        });

        it('should get user activity', async () => {
            const res = await chai.request(app)
                .get(`/api/analytics/users/${testUser._id}/activity`)
                .set('Authorization', `Bearer ${testUserToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('posts');
            expect(res.body).to.have.property('threads');
        });
    });
}); 