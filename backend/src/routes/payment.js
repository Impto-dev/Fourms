const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get available ranks and prices
router.get('/ranks', (req, res) => {
    const ranks = {
        premium: {
            name: 'Premium',
            price: 9.99,
            features: [
                'Custom username color',
                'Larger avatar size',
                'Priority support',
                'No ads'
            ]
        },
        vip: {
            name: 'VIP',
            price: 19.99,
            features: [
                'All Premium features',
                'Custom profile banner',
                'Signature editor',
                'Early access to new features'
            ]
        },
        elite: {
            name: 'Elite',
            price: 49.99,
            features: [
                'All VIP features',
                'Custom rank title',
                'Private forum access',
                'Exclusive content'
            ]
        }
    };

    res.json({
        success: true,
        ranks
    });
});

// Create Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { rank } = req.body;
        const user = req.user;

        // Validate rank
        const ranks = {
            premium: 999,
            vip: 1999,
            elite: 4999
        };

        if (!ranks[rank]) {
            return res.status(400).json({
                success: false,
                error: 'Invalid rank'
            });
        }

        // Create Stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${rank.charAt(0).toUpperCase() + rank.slice(1)} Rank`,
                        description: `Upgrade to ${rank} rank`
                    },
                    unit_amount: ranks[rank]
                },
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/upgrade`,
            metadata: {
                userId: user._id.toString(),
                rank
            }
        });

        res.json({
            success: true,
            sessionId: session.id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error creating checkout session'
        });
    }
});

// Handle Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, rank } = session.metadata;

        try {
            // Update user's rank
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year subscription

            await User.findByIdAndUpdate(userId, {
                rank,
                rankExpiry: expiryDate
            });

            // Send confirmation email (implement email service)
            // await sendRankUpgradeEmail(userId, rank);
        } catch (error) {
            console.error('Error processing webhook:', error);
        }
    }

    res.json({ received: true });
});

// Payment routes
router.post('/intent', auth, paymentController.createPaymentIntent);
router.post('/subscription', auth, paymentController.createSubscription);
router.delete('/subscription/:subscriptionId', auth, paymentController.cancelSubscription);
router.get('/history', auth, paymentController.getPaymentHistory);

// Admin routes
router.post('/refund/:paymentId', auth, admin, paymentController.processRefund);

module.exports = router; 