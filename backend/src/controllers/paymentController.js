const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const User = require('../models/User');
const Rank = require('../models/Rank');
const { catchAsync } = require('../utils/helpers');
const DiscordService = require('../services/discordService');
const stripeService = require('../services/stripeService');
const asyncHandler = require('../middleware/error');

const discordService = new DiscordService(process.env.DISCORD_WEBHOOK_URL);

const paymentController = {
  /**
   * Create a payment intent for a one-time payment
   * @route POST /api/payments/create-intent
   * @access Private
   */
  createPaymentIntent: asyncHandler(async (req, res) => {
    const { amount, currency } = req.body;
    const paymentIntent = await stripeService.createPaymentIntent(req.user, amount, currency);
    res.json({ clientSecret: paymentIntent.client_secret });
  }),

  /**
   * Create a subscription
   * @route POST /api/payments/subscribe
   * @access Private
   */
  createSubscription: asyncHandler(async (req, res) => {
    const { priceId } = req.body;
    const subscription = await stripeService.createSubscription(req.user, priceId);
    res.json({ subscriptionId: subscription.id, clientSecret: subscription.latest_invoice.payment_intent.client_secret });
  }),

  /**
   * Cancel a subscription
   * @route POST /api/payments/cancel-subscription
   * @access Private
   */
  cancelSubscription: asyncHandler(async (req, res) => {
    const { subscriptionId } = req.body;
    const subscription = await stripeService.cancelSubscription(subscriptionId);
    res.json({ subscription });
  }),

  /**
   * Get subscription status
   * @route GET /api/payments/subscription-status
   * @access Private
   */
  getSubscriptionStatus: asyncHandler(async (req, res) => {
    const status = await stripeService.getSubscriptionStatus(req.user);
    res.json(status);
  }),

  /**
   * Handle Stripe webhook events
   * @route POST /api/payments/webhook
   * @access Public
   */
  handleWebhook: asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await stripeService.handleWebhook(event);
    res.json({ received: true });
  }),

  // Create a payment intent
  createPaymentIntentOld: catchAsync(async (req, res) => {
    const { amount, currency, paymentMethod, subscriptionType, rankId } = req.body;

    // Create a customer if not exists
    let customer;
    if (!req.user.stripeCustomerId) {
      customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: req.user._id.toString()
        }
      });
      req.user.stripeCustomerId = customer.id;
      await req.user.save();
    } else {
      customer = await stripe.customers.retrieve(req.user.stripeCustomerId);
    }

    try {
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customer.id,
        payment_method: paymentMethod,
        confirm: true,
        metadata: {
          userId: req.user._id.toString(),
          subscriptionType,
          rankId
        }
      });

      // Create payment record
      const payment = await Payment.create({
        user: req.user._id,
        amount: amount / 100, // Convert from cents to dollars
        currency,
        paymentMethod,
        status: 'completed',
        stripePaymentId: paymentIntent.id,
        stripeCustomerId: customer.id,
        subscription: {
          type: subscriptionType,
          startDate: new Date(),
          endDate: calculateEndDate(subscriptionType)
        },
        rankUpgrade: rankId
      });

      // Update user's rank if applicable
      if (rankId) {
        const rank = await Rank.findById(rankId);
        if (rank) {
          req.user.rank = rank._id;
          await req.user.save();
        }
      }

      // Send Discord notification
      await discordService.sendPaymentSuccess(payment);

      res.status(200).json({
        status: 'success',
        data: {
          payment,
          clientSecret: paymentIntent.client_secret
        }
      });
    } catch (error) {
      // Send Discord notification for failed payment
      await discordService.sendPaymentFailed({
        user: req.user,
        amount: amount / 100,
        currency,
        subscription: { type: subscriptionType }
      }, error);

      throw error;
    }
  }),

  // Create a subscription
  createSubscriptionOld: catchAsync(async (req, res) => {
    const { priceId, paymentMethod } = req.body;

    // Create a customer if not exists
    let customer;
    if (!req.user.stripeCustomerId) {
      customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          userId: req.user._id.toString()
        }
      });
      req.user.stripeCustomerId = customer.id;
      await req.user.save();
    } else {
      customer = await stripe.customers.retrieve(req.user.stripeCustomerId);
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethod, {
      customer: customer.id
    });

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod
      }
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent']
    });

    // Create payment record
    const payment = await Payment.create({
      user: req.user._id,
      amount: subscription.items.data[0].price.unit_amount / 100,
      currency: subscription.items.data[0].price.currency,
      paymentMethod,
      status: 'completed',
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      subscription: {
        type: subscription.items.data[0].price.recurring.interval,
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        autoRenew: true
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        payment,
        subscription
      }
    });
  }),

  // Cancel subscription
  cancelSubscriptionOld: catchAsync(async (req, res) => {
    const { subscriptionId } = req.params;

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    await Payment.findOneAndUpdate(
      { stripeSubscriptionId: subscriptionId },
      {
        'subscription.autoRenew': false
      }
    );

    res.status(200).json({
      status: 'success',
      data: subscription
    });
  }),

  // Get payment history
  getPaymentHistory: catchAsync(async (req, res) => {
    const payments = await Payment.find({ user: req.user._id })
      .sort('-createdAt')
      .populate('rankUpgrade');

    res.status(200).json({
      status: 'success',
      data: payments
    });
  }),

  // Process refund
  processRefund: catchAsync(async (req, res) => {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      reason: 'requested_by_customer'
    });

    payment.status = 'refunded';
    payment.refundReason = reason;
    await payment.save();

    res.status(200).json({
      status: 'success',
      data: {
        payment,
        refund
      }
    });
  })
};

module.exports = paymentController;

// Helper function to calculate subscription end date
function calculateEndDate(subscriptionType) {
  const date = new Date();
  switch (subscriptionType) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'lifetime':
      date.setFullYear(date.getFullYear() + 100); // Effectively lifetime
      break;
  }
  return date;
} 