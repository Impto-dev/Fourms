const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index');
const User = require('../src/models/User');

// Test data
const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123!'
};

// Before all tests
beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI + '_test');
});

// After all tests
afterAll(async () => {
    // Clean up test database
    await User.deleteMany({});
    await mongoose.connection.close();
});

// Before each test
beforeEach(async () => {
    // Clear the database
    await User.deleteMany({});
});

describe('Authentication API', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.user).toHaveProperty('username', testUser.username);
            expect(response.body.user).toHaveProperty('email', testUser.email);
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should not register with existing email', async () => {
            // Create a user first
            await request(app)
                .post('/api/auth/register')
                .send(testUser);

            // Try to register with same email
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    ...testUser,
                    username: 'differentuser'
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email already exists');
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Register a user first
            await request(app)
                .post('/api/auth/register')
                .send(testUser);
        });

        it('should login with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('username', testUser.username);
        });

        it('should not login with incorrect password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid credentials');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            // First login to get token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            const token = loginResponse.body.token;

            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });
}); 