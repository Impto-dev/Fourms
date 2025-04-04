const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    order: {
        type: Number,
        default: 0
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    allowedRoles: [{
        type: String,
        enum: ['user', 'moderator', 'admin']
    }],
    threadCount: {
        type: Number,
        default: 0
    },
    postCount: {
        type: Number,
        default: 0
    },
    lastThread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread'
    },
    lastPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    lastPostAt: {
        type: Date
    },
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
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1, order: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

// Methods
categorySchema.methods.updateCounts = async function() {
    const Thread = mongoose.model('Thread');
    const Post = mongoose.model('Post');

    const threadCount = await Thread.countDocuments({ category: this._id });
    const postCount = await Post.countDocuments({ thread: { $in: await Thread.find({ category: this._id }).select('_id') } });

    this.threadCount = threadCount;
    this.postCount = postCount;
    await this.save();
};

categorySchema.methods.updateLastPost = async function() {
    const Thread = mongoose.model('Thread');
    const Post = mongoose.model('Post');

    const lastThread = await Thread.findOne({ category: this._id })
        .sort({ lastPostAt: -1 });

    if (lastThread) {
        this.lastThread = lastThread._id;
        this.lastPost = lastThread.lastPost;
        this.lastPostAt = lastThread.lastPostAt;
        await this.save();
    }
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 