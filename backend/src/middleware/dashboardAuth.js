const jwt = require('jsonwebtoken');
const DashboardAuth = require('../models/DashboardAuth');

const dashboardAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists and is active
    const user = await DashboardAuth.findOne({
      _id: decoded.id,
      isActive: true
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Add user to request
    req.dashboardUser = {
      id: user._id,
      username: user.username,
      permissions: user.permissions
    };

    next();
  } catch (error) {
    console.error('Dashboard auth error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = dashboardAuth; 