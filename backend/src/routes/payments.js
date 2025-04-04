const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes except webhook
router.use((req, res, next) => {
    if (req.path === '/webhook') {
        next();
    } else {
        authenticate(req, res, next);
    }
});

// Create payment intent
router.post('/create-intent', paymentController.createPaymentIntent);

// Create subscription
router.post('/subscribe', paymentController.createSubscription);

// Cancel subscription
router.post('/cancel-subscription', paymentController.cancelSubscription);

// Get subscription status
router.get('/subscription-status', paymentController.getSubscriptionStatus);

// Handle Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router; 