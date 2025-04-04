const DashboardAuth = require('../models/DashboardAuth');
const jwt = require('jsonwebtoken');

const dashboardAuthController = {
  // Login to dashboard
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Find user
      const user = await DashboardAuth.findOne({ username, isActive: true });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      // Generate token
      const token = jwt.sign(
        { 
          id: user._id,
          username: user.username,
          permissions: user.permissions
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          permissions: user.permissions
        }
      });
    } catch (error) {
      console.error('Dashboard login error:', error);
      res.status(500).json({ message: 'Error logging in' });
    }
  },

  // Create new dashboard user (admin only)
  async createUser(req, res) {
    try {
      const { username, password, permissions } = req.body;

      // Check if username exists
      const existingUser = await DashboardAuth.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      // Create new user
      const user = new DashboardAuth({
        username,
        password,
        permissions: {
          view: true,
          manageIPs: permissions?.manageIPs || false,
          updateThresholds: permissions?.updateThresholds || false,
          manageAccess: permissions?.manageAccess || false
        }
      });

      await user.save();

      res.status(201).json({
        message: 'Dashboard user created successfully',
        user: {
          id: user._id,
          username: user.username,
          permissions: user.permissions
        }
      });
    } catch (error) {
      console.error('Error creating dashboard user:', error);
      res.status(500).json({ message: 'Error creating user' });
    }
  },

  // Update dashboard user (admin only)
  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { password, permissions, isActive } = req.body;

      const user = await DashboardAuth.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update fields if provided
      if (password) user.password = password;
      if (permissions) user.permissions = { ...user.permissions, ...permissions };
      if (typeof isActive === 'boolean') user.isActive = isActive;

      await user.save();

      res.json({
        message: 'User updated successfully',
        user: {
          id: user._id,
          username: user.username,
          permissions: user.permissions,
          isActive: user.isActive
        }
      });
    } catch (error) {
      console.error('Error updating dashboard user:', error);
      res.status(500).json({ message: 'Error updating user' });
    }
  },

  // Delete dashboard user (admin only)
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      const result = await DashboardAuth.findByIdAndDelete(userId);
      if (!result) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting dashboard user:', error);
      res.status(500).json({ message: 'Error deleting user' });
    }
  },

  // Get all dashboard users (admin only)
  async getUsers(req, res) {
    try {
      const users = await DashboardAuth.find()
        .select('-password')
        .sort({ createdAt: -1 });

      res.json(users);
    } catch (error) {
      console.error('Error getting dashboard users:', error);
      res.status(500).json({ message: 'Error getting users' });
    }
  }
};

module.exports = dashboardAuthController; 