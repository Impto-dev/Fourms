const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['open', 'closed', 'pinned', 'archived'],
        default: 'open'
    },
    views: {
        type: Number,
        default: 0
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    lastPostBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastPostAt: {
        type: Date
    },
    isSticky: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    attachments: [{
        filename: String,
        path: String,
        size: Number,
        type: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
threadSchema.index({ title: 'text', content: 'text' });
threadSchema.index({ category: 1, createdAt: -1 });
threadSchema.index({ author: 1, createdAt: -1 });

// Virtual for post count
threadSchema.virtual('postCount', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'thread',
    count: true
});

// Methods
threadSchema.methods.incrementViews = async function() {
    this.views += 1;
    await this.save();
};

threadSchema.methods.toggleLike = async function(userId) {
    const index = this.likes.indexOf(userId);
    if (index === -1) {
        this.likes.push(userId);
    } else {
        this.likes.splice(index, 1);
    }
    await this.save();
};

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread; 