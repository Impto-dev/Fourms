import api from './api';

const paymentService = {
    /**
     * Create a payment intent
     * @param {Number} amount - Amount in cents
     * @param {String} currency - Currency code
     * @returns {Promise<Object>} Payment intent
     */
    createPaymentIntent: async (amount, currency = 'usd') => {
        const response = await api.post('/payments/create-intent', { amount, currency });
        return response.data;
    },

    /**
     * Create a subscription
     * @param {String} priceId - Stripe price ID
     * @returns {Promise<Object>} Subscription
     */
    createSubscription: async (priceId) => {
        const response = await api.post('/payments/subscribe', { priceId });
        return response.data;
    },

    /**
     * Cancel a subscription
     * @param {String} subscriptionId - Stripe subscription ID
     * @returns {Promise<Object>} Cancelled subscription
     */
    cancelSubscription: async (subscriptionId) => {
        const response = await api.post('/payments/cancel-subscription', { subscriptionId });
        return response.data;
    },

    /**
     * Get subscription status
     * @returns {Promise<Object>} Subscription status
     */
    getSubscriptionStatus: async () => {
        const response = await api.get('/payments/subscription-status');
        return response.data;
    }
};

export default paymentService; 