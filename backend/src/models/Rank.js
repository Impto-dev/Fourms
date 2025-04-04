const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  level: {
    type: Number,
    required: true,
    unique: true
  },
  minPoints: {
    type: Number,
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'create_thread',
      'create_post',
      'edit_own_thread',
      'edit_own_post',
      'delete_own_thread',
      'delete_own_post',
      'upload_files',
      'use_rich_text',
      'mention_users',
      'report_content',
      'view_analytics'
    ]
  }],
  badge: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Add index for faster queries
rankSchema.index({ level: 1 });
rankSchema.index({ minPoints: 1 });

const Rank = mongoose.model('Rank', rankSchema);

module.exports = Rank; 