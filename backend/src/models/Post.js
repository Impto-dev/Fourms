const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    thread: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Thread',
        required: true
    },
    parentPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['published', 'hidden', 'deleted'],
        default: 'published'
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    editHistory: [{
        content: String,
        editedAt: {
            type: Date,
            default: Date.now
        },
        editedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
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
postSchema.index({ thread: 1, createdAt: 1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ content: 'text' });

// Methods
postSchema.methods.toggleLike = async function(userId) {
    const index = this.likes.indexOf(userId);
    if (index === -1) {
        this.likes.push(userId);
    } else {
        this.likes.splice(index, 1);
    }
    await this.save();
};

postSchema.methods.edit = async function(newContent, editedBy) {
    this.editHistory.push({
        content: this.content,
        editedBy: editedBy
    });
    this.content = newContent;
    this.isEdited = true;
    await this.save();
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post; 