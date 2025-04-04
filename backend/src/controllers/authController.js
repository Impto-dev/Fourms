const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');
const { validationResult } = require('express-validator');
const DiscordService = require('../services/discordService');

const discordService = new DiscordService(process.env.DISCORD_WEBHOOK_URL);

// Register new user
exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        user = new User({
            username,
            email,
            password
        });

        // Send Discord notification
        await discordService.sendUserRegistration(user);

        // Generate email verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        await sendEmail({
            to: user.email,
            subject: 'Verify your email',
            html: `Please click <a href="${verificationUrl}">here</a> to verify your email.`
        });

        // Generate JWT token
        const token = user.generateAuthToken();

        res.status(201).json({
            message: 'User registered successfully. Please check your email for verification.',
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        // Generate JWT token
        const token = user.generateAuthToken();

        // Update last active
        user.lastActive = new Date();
        await user.save();

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                rank: user.rank
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Verify email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findOne({
            _id: decoded._id,
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Update user
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        await sendEmail({
            to: user.email,
            subject: 'Password Reset',
            html: `Please click <a href="${resetUrl}">here</a> to reset your password.`
        });

        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findOne({
            _id: decoded._id,
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Update password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Social login (Google, Facebook, GitHub)
exports.socialLogin = async (req, res) => {
    try {
        const { provider, token } = req.body;
        let user;

        // Verify social token and get user info
        const socialUser = await verifySocialToken(provider, token);

        // Find or create user
        user = await User.findOne({ [`socialLinks.${provider}Id`]: socialUser.id });
        
        if (!user) {
            user = new User({
                username: socialUser.username,
                email: socialUser.email,
                [`socialLinks.${provider}Id`]: socialUser.id,
                isEmailVerified: true
            });
            await user.save();
        }

        // Generate JWT token
        const authToken = user.generateAuthToken();

        res.json({
            token: authToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                rank: user.rank
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 