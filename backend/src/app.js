const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const threadRoutes = require('./routes/threads');
const postRoutes = require('./routes/posts');
const categoryRoutes = require('./routes/categories');
const dashboardRoutes = require('./routes/dashboardRoutes');
const dashboardAccessRoutes = require('./routes/dashboardAccessRoutes');
const advancedRateLimitRoutes = require('./routes/advancedRateLimitRoutes');
const securityAnalyticsRoutes = require('./routes/securityAnalyticsRoutes');
const auditRoutes = require('./routes/auditRoutes');
const searchRoutes = require('./routes/searchRoutes');

// Initialize app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

const advancedRateLimiter = require('./middleware/advancedRateLimit');
const auditMiddleware = require('./middleware/auditMiddleware');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dashboard/access', dashboardAccessRoutes);
app.use('/api/rate-limit', advancedRateLimitRoutes);
app.use('/api/security', securityAnalyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/search', searchRoutes);

// Apply advanced rate limiting middleware
app.use(advancedRateLimiter);

// Apply audit middleware
app.use(auditMiddleware());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

module.exports = app; 