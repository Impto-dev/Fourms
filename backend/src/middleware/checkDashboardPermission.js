const DashboardAccess = require('../models/DashboardAccess');

const checkDashboardPermission = (permission) => async (req, res, next) => {
  try {
    // First check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Then check for specific dashboard permission
    const access = await DashboardAccess.findOne({ user: req.user._id });
    
    if (!access || !access.permissions[permission]) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  } catch (error) {
    console.error('Error checking dashboard permission:', error);
    res.status(500).json({ message: 'Error checking permissions' });
  }
};

module.exports = checkDashboardPermission; 