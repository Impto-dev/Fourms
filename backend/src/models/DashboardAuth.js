const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const dashboardAuthSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  permissions: {
    view: { type: Boolean, default: true },
    manageIPs: { type: Boolean, default: false },
    updateThresholds: { type: Boolean, default: false },
    manageAccess: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
dashboardAuthSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
dashboardAuthSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('DashboardAuth', dashboardAuthSchema); 