const { expect } = require('chai');
const sinon = require('sinon');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../src/models/User');
const stripeService = require('../src/services/stripeService');

describe('Payment Service', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('createCustomer', () => {
        it('should create a new Stripe customer and update user', async () => {
            const mockUser = {
                _id: '123',
                email: 'test@example.com',
                username: 'testuser',
                save: sandbox.stub().resolves()
            };

            const mockCustomer = {
                id: 'cus_123',
                email: 'test@example.com',
                name: 'testuser'
            };

            sandbox.stub(stripe.customers, 'create').resolves(mockCustomer);

            const result = await stripeService.createCustomer(mockUser);

            expect(result).to.deep.equal(mockCustomer);
            expect(mockUser.save.calledOnce).to.be.true;
            expect(mockUser.stripeCustomerId).to.equal('cus_123');
        });

        it('should handle errors when creating customer', async () => {
            const mockUser = {
                _id: '123',
                email: 'test@example.com',
                username: 'testuser'
            };

            sandbox.stub(stripe.customers, 'create').rejects(new Error('Stripe error'));

            try {
                await stripeService.createCustomer(mockUser);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Stripe error');
            }
        });
    });

    describe('createPaymentIntent', () => {
        it('should create a payment intent for a user', async () => {
            const mockUser = {
                _id: '123',
                stripeCustomerId: 'cus_123'
            };

            const mockPaymentIntent = {
                id: 'pi_123',
                client_secret: 'secret_123',
                amount: 1000,
                currency: 'usd'
            };

            sandbox.stub(stripe.paymentIntents, 'create').resolves(mockPaymentIntent);

            const result = await stripeService.createPaymentIntent(mockUser, 1000, 'usd');

            expect(result).to.deep.equal(mockPaymentIntent);
            expect(stripe.paymentIntents.create.calledWith({
                amount: 1000,
                currency: 'usd',
                customer: 'cus_123',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    userId: '123'
                }
            })).to.be.true;
        });
    });

    describe('createSubscription', () => {
        it('should create a subscription for a user', async () => {
            const mockUser = {
                _id: '123',
                stripeCustomerId: 'cus_123'
            };

            const mockSubscription = {
                id: 'sub_123',
                latest_invoice: {
                    payment_intent: {
                        client_secret: 'secret_123'
                    }
                }
            };

            sandbox.stub(stripe.subscriptions, 'create').resolves(mockSubscription);

            const result = await stripeService.createSubscription(mockUser, 'price_123');

            expect(result).to.deep.equal(mockSubscription);
            expect(stripe.subscriptions.create.calledWith({
                customer: 'cus_123',
                items: [{ price: 'price_123' }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                    userId: '123'
                }
            })).to.be.true;
        });
    });

    describe('cancelSubscription', () => {
        it('should cancel a subscription', async () => {
            const mockSubscription = {
                id: 'sub_123',
                status: 'canceled'
            };

            sandbox.stub(stripe.subscriptions, 'cancel').resolves(mockSubscription);

            const result = await stripeService.cancelSubscription('sub_123');

            expect(result).to.deep.equal(mockSubscription);
            expect(stripe.subscriptions.cancel.calledWith('sub_123')).to.be.true;
        });
    });

    describe('getSubscriptionStatus', () => {
        it('should return subscription status from cache', async () => {
            const mockUser = {
                _id: '123'
            };

            const mockStatus = {
                active: true,
                subscription: {
                    id: 'sub_123'
                }
            };

            sandbox.stub(redis, 'get').resolves(JSON.stringify(mockStatus));

            const result = await stripeService.getSubscriptionStatus(mockUser);

            expect(result).to.deep.equal(mockStatus);
        });

        it('should fetch and cache subscription status if not in cache', async () => {
            const mockUser = {
                _id: '123',
                stripeCustomerId: 'cus_123'
            };

            const mockSubscriptions = {
                data: [{
                    id: 'sub_123',
                    status: 'active'
                }]
            };

            sandbox.stub(redis, 'get').resolves(null);
            sandbox.stub(stripe.subscriptions, 'list').resolves(mockSubscriptions);
            sandbox.stub(redis, 'set').resolves();

            const result = await stripeService.getSubscriptionStatus(mockUser);

            expect(result).to.deep.equal({
                active: true,
                subscription: mockSubscriptions.data[0]
            });
            expect(redis.set.calledWith(
                `subscription:${mockUser._id}`,
                JSON.stringify({
                    active: true,
                    subscription: mockSubscriptions.data[0]
                }),
                'EX',
                300
            )).to.be.true;
        });
    });
}); 