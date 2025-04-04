const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long'],
        maxlength: [20, 'Username cannot exceed 20 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'moderator', 'admin'],
        default: 'user'
    },
    rank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rank'
    },
    points: {
        type: Number,
        default: 0
    },
    badges: [{
        type: String
    }],
    achievements: [{
        type: String
    }],
    lastActivity: {
        type: Date,
        default: Date.now
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    banReason: {
        type: String
    },
    banExpires: {
        type: Date
    },
    reportedCount: {
        type: Number,
        default: 0
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    displayName: {
        type: String,
        trim: true,
        maxlength: [30, 'Display name cannot exceed 30 characters']
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    signature: {
        type: String,
        maxlength: [200, 'Signature cannot exceed 200 characters']
    },
    avatar: {
        type: String,
        default: 'default-avatar.png'
    },
    banner: {
        type: String,
        default: 'default-banner.jpg'
    },
    location: String,
    website: String,
    discordId: {
        type: String,
        unique: true,
        sparse: true
    },
    stats: {
        posts: {
            type: Number,
            default: 0
        },
        threads: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        }
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        }
    },
    socialLinks: {
        googleId: String,
        facebookId: String,
        githubId: String
    },
    lastActive: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: Date,
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String,
        select: false
    },
    twoFactorBackupCodes: {
        type: [String],
        select: false
    },
    twoFactorRecoveryToken: {
        type: String,
        select: false
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lastFailedLogin: Date,
    accountLockedUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            _id: this._id,
            role: this.role,
            twoFactorEnabled: this.twoFactorEnabled
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
    const token = jwt.sign(
        { _id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    this.emailVerificationToken = token;
    this.emailVerificationExpires = Date.now() + 3600000; // 1 hour
    return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
    const token = jwt.sign(
        { _id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    this.resetPasswordToken = token;
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    return token;
};

// Update stats methods
userSchema.methods.incrementPosts = async function() {
    this.stats.posts += 1;
    await this.save();
};

userSchema.methods.incrementThreads = async function() {
    this.stats.threads += 1;
    await this.save();
};

userSchema.methods.incrementLikes = async function() {
    this.stats.likes += 1;
    await this.save();
};

// Method to generate 2FA verification token
userSchema.methods.generate2FAToken = function() {
    return jwt.sign(
        { 
            id: this._id,
            twoFactorRequired: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
    );
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
    if (this.accountLockedUntil) {
        return this.accountLockedUntil > new Date();
    }
    return false;
};

// Method to increment failed login attempts
userSchema.methods.incrementFailedLoginAttempts = async function() {
    this.failedLoginAttempts += 1;
    this.lastFailedLogin = new Date();
    
    if (this.failedLoginAttempts >= 5) {
        this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }
    
    await this.save();
};

// Method to reset failed login attempts
userSchema.methods.resetFailedLoginAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
    await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User; 