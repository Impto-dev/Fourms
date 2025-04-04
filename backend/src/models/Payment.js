const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'usd'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  subscription: {
    type: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime'],
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    autoRenew: {
      type: Boolean,
      default: true
    }
  },
  rankUpgrade: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rank'
  },
  stripePaymentId: {
    type: String
  },
  stripeCustomerId: {
    type: String
  },
  stripeSubscriptionId: {
    type: String
  },
  refundReason: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Add indexes for faster queries
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ stripePaymentId: 1 });
paymentSchema.index({ stripeCustomerId: 1 });
paymentSchema.index({ stripeSubscriptionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 