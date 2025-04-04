const DashboardAccess = require('../models/DashboardAccess');
const User = require('../models/User');

const dashboardAccessController = {
  // Get all users with dashboard access
  async getAccessList(req, res) {
    try {
      const accessList = await DashboardAccess.find()
        .populate('user', 'username email')
        .populate('grantedBy', 'username')
        .sort({ createdAt: -1 });
      
      res.json(accessList);
    } catch (error) {
      console.error('Error getting access list:', error);
      res.status(500).json({ message: 'Error getting access list' });
    }
  },

  // Grant dashboard access to a user
  async grantAccess(req, res) {
    try {
      const { userId, permissions } = req.body;
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if access already exists
      const existingAccess = await DashboardAccess.findOne({ user: userId });
      if (existingAccess) {
        return res.status(400).json({ message: 'User already has dashboard access' });
      }

      // Create new access record
      const access = new DashboardAccess({
        user: userId,
        grantedBy: req.user._id,
        permissions: {
          view: true,
          manageIPs: permissions?.manageIPs || false,
          updateThresholds: permissions?.updateThresholds || false,
          manageAccess: permissions?.manageAccess || false
        }
      });

      await access.save();

      res.status(201).json(access);
    } catch (error) {
      console.error('Error granting access:', error);
      res.status(500).json({ message: 'Error granting access' });
    }
  },

  // Update user's dashboard permissions
  async updatePermissions(req, res) {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      const access = await DashboardAccess.findOne({ user: userId });
      if (!access) {
        return res.status(404).json({ message: 'Access record not found' });
      }

      // Update permissions
      access.permissions = {
        ...access.permissions,
        ...permissions
      };

      await access.save();

      res.json(access);
    } catch (error) {
      console.error('Error updating permissions:', error);
      res.status(500).json({ message: 'Error updating permissions' });
    }
  },

  // Revoke dashboard access
  async revokeAccess(req, res) {
    try {
      const { userId } = req.params;

      const result = await DashboardAccess.findOneAndDelete({ user: userId });
      if (!result) {
        return res.status(404).json({ message: 'Access record not found' });
      }

      res.json({ message: 'Access revoked successfully' });
    } catch (error) {
      console.error('Error revoking access:', error);
      res.status(500).json({ message: 'Error revoking access' });
    }
  },

  // Check if user has specific permission
  async checkPermission(req, res) {
    try {
      const { userId } = req.params;
      const { permission } = req.query;

      const access = await DashboardAccess.findOne({ user: userId });
      if (!access) {
        return res.json({ hasPermission: false });
      }

      res.json({ hasPermission: access.permissions[permission] || false });
    } catch (error) {
      console.error('Error checking permission:', error);
      res.status(500).json({ message: 'Error checking permission' });
    }
  }
};

module.exports = dashboardAccessController; 