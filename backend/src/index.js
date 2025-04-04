const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const securityHeaders = require('./middleware/security');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Import security middleware
const { generalLimiter, authLimiter, forumLimiter } = require('./middleware/rateLimiter');
const sanitize = require('./middleware/sanitize');
const suspiciousActivity = require('./middleware/suspiciousActivity');
const { logger } = require('./utils/securityLogger');

// Load environment variables
dotenv.config();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Import routes
const authRoutes = require('./routes/auth');
const forumRoutes = require('./routes/forum');
const securityRoutes = require('./routes/security');
const fileRoutes = require('./routes/file');
const rankRoutes = require('./routes/rank');
const moderationRoutes = require('./routes/moderation');
const paymentRoutes = require('./routes/payment');

// Initialize express app
const app = express();

// Apply security middleware
securityHeaders(app);
app.use(sanitize);
app.use(suspiciousActivity);
app.use(generalLimiter);

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parser middleware with size limits
app.use(express.json({ 
    limit: '10kb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10kb',
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

// Connect to MongoDB with security options
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
})
.then(() => logger.info('Connected to MongoDB'))
.catch(err => logger.error('MongoDB connection error:', err));

// Apply rate limiters to specific routes
app.use('/api/auth', authLimiter);
app.use('/api/threads', forumLimiter);
app.use('/api/posts', forumLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', forumRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ranks', rankRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/payments', paymentRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: err.message
        });
    }

    if (err.name === 'JsonWebTokenError') {
        logger.warn('Invalid JWT token attempt:', {
            ip: req.ip,
            path: req.path
        });
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        logger.warn('Expired JWT token attempt:', {
            ip: req.ip,
            path: req.path
        });
        return res.status(401).json({
            success: false,
            error: 'Token expired'
        });
    }

    // Default error
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
}); 