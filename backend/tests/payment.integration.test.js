const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const { createTestUser, getAuthToken } = require('./helpers');

describe('Payment Integration Tests', () => {
    let testUser;
    let authToken;

    before(async () => {
        testUser = await createTestUser();
        authToken = await getAuthToken(testUser);
    });

    after(async () => {
        await User.deleteMany({});
    });

    describe('POST /api/payments/create-intent', () => {
        it('should create a payment intent', async () => {
            const response = await request(app)
                .post('/api/payments/create-intent')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 1000,
                    currency: 'usd'
                });

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('clientSecret');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/payments/create-intent')
                .send({
                    amount: 1000,
                    currency: 'usd'
                });

            expect(response.status).to.equal(401);
        });

        it('should validate request body', async () => {
            const response = await request(app)
                .post('/api/payments/create-intent')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    amount: 'invalid',
                    currency: 'usd'
                });

            expect(response.status).to.equal(400);
        });
    });

    describe('POST /api/payments/subscribe', () => {
        it('should create a subscription', async () => {
            const response = await request(app)
                .post('/api/payments/subscribe')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    priceId: 'price_123'
                });

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('subscriptionId');
            expect(response.body).to.have.property('clientSecret');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/payments/subscribe')
                .send({
                    priceId: 'price_123'
                });

            expect(response.status).to.equal(401);
        });

        it('should validate request body', async () => {
            const response = await request(app)
                .post('/api/payments/subscribe')
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).to.equal(400);
        });
    });

    describe('POST /api/payments/cancel-subscription', () => {
        it('should cancel a subscription', async () => {
            const response = await request(app)
                .post('/api/payments/cancel-subscription')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    subscriptionId: 'sub_123'
                });

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('subscription');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/payments/cancel-subscription')
                .send({
                    subscriptionId: 'sub_123'
                });

            expect(response.status).to.equal(401);
        });

        it('should validate request body', async () => {
            const response = await request(app)
                .post('/api/payments/cancel-subscription')
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).to.equal(400);
        });
    });

    describe('GET /api/payments/subscription-status', () => {
        it('should get subscription status', async () => {
            const response = await request(app)
                .get('/api/payments/subscription-status')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('active');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/payments/subscription-status');

            expect(response.status).to.equal(401);
        });
    });

    describe('POST /api/payments/webhook', () => {
        it('should handle Stripe webhook events', async () => {
            const response = await request(app)
                .post('/api/payments/webhook')
                .set('stripe-signature', 'test_signature')
                .send({
                    type: 'payment_intent.succeeded',
                    data: {
                        object: {
                            id: 'pi_123',
                            amount: 1000,
                            currency: 'usd',
                            metadata: {
                                userId: testUser._id.toString()
                            }
                        }
                    }
                });

            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('received', true);
        });
    });
}); 