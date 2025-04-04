const mongoose = require('mongoose');

const socialLoginSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['google', 'github']
  },
  providerId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  displayName: {
    type: String
  },
  avatar: {
    type: String
  },
  accessToken: {
    type: String
  },
  refreshToken: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
socialLoginSchema.index({ provider: 1, providerId: 1 }, { unique: true });
socialLoginSchema.index({ user: 1 });

const SocialLogin = mongoose.model('SocialLogin', socialLoginSchema);

module.exports = SocialLogin; 