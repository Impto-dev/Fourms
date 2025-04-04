import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import paymentService from '../../services/paymentService';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentForm = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState('usd');

    useEffect(() => {
        const fetchSubscriptionStatus = async () => {
            try {
                const status = await paymentService.getSubscriptionStatus();
                setSubscriptionStatus(status);
            } catch (error) {
                console.error('Error fetching subscription status:', error);
            }
        };

        fetchSubscriptionStatus();
    }, []);

    const handlePayment = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { clientSecret } = await paymentService.createPaymentIntent(
                parseInt(amount) * 100, // Convert to cents
                currency
            );

            const stripe = await stripePromise;
            const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                }
            });

            if (stripeError) {
                throw new Error(stripeError.message);
            }

            setSuccess(true);
            setAmount('');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscription = async (priceId) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const { clientSecret } = await paymentService.createSubscription(priceId);

            const stripe = await stripePromise;
            const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                }
            });

            if (stripeError) {
                throw new Error(stripeError.message);
            }

            setSuccess(true);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!subscriptionStatus?.subscription?.id) return;

        setLoading(true);
        setError(null);

        try {
            await paymentService.cancelSubscription(subscriptionStatus.subscription.id);
            setSubscriptionStatus({ active: false });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Payment
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Payment successful!
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={loading}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Currency</InputLabel>
                                <Select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    disabled={loading}
                                >
                                    <MenuItem value="usd">USD</MenuItem>
                                    <MenuItem value="eur">EUR</MenuItem>
                                    <MenuItem value="gbp">GBP</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <CardElement
                                options={{
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#424770',
                                            '::placeholder': {
                                                color: '#aab7c4',
                                            },
                                        },
                                        invalid: {
                                            color: '#9e2146',
                                        },
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handlePayment}
                                disabled={loading || !amount}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Pay'}
                            </Button>
                        </Grid>
                    </Grid>

                    {subscriptionStatus?.active && (
                        <Box sx={{ mt: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Current Subscription
                            </Typography>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleCancelSubscription}
                                disabled={loading}
                            >
                                Cancel Subscription
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

const PaymentFormWrapper = () => (
    <Elements stripe={stripePromise}>
        <PaymentForm />
    </Elements>
);

export default PaymentFormWrapper; 