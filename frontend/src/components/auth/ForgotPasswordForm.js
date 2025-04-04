import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { Button, TextField, Box, Typography, Alert } from '@mui/material';

const schema = yup.object().shape({
    email: yup.string()
        .email('Invalid email')
        .required('Email is required')
});

const ForgotPasswordForm = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        try {
            setError('');
            setSuccess('');
            setLoading(true);
            await axios.post('/api/auth/forgot-password', data);
            setSuccess('Password reset email sent. Please check your inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            <Typography variant="body1" sx={{ mb: 2 }}>
                Enter your email address and we'll send you a link to reset your password.
            </Typography>
            
            <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                autoComplete="email"
                autoFocus
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
            />
            
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
            >
                {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
                <Button
                    color="primary"
                    onClick={() => navigate('/login')}
                    sx={{ textTransform: 'none' }}
                >
                    Back to login
                </Button>
            </Box>
        </Box>
    );
};

export default ForgotPasswordForm; 