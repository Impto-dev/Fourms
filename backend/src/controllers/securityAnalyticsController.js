const securityAnalytics = require('../services/securityAnalytics');

// Track security event
exports.trackEvent = async (req, res) => {
  try {
    const { type, ip, details } = req.body;
    
    if (!type || !ip) {
      return res.status(400).json({ error: 'Type and IP are required' });
    }
    
    await securityAnalytics.trackEvent({
      type,
      ip,
      details: details || {}
    });
    
    res.json({ message: 'Event tracked successfully' });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
};

// Get risk score for an IP
exports.getRiskScore = async (req, res) => {
  try {
    const { ip } = req.query;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP is required' });
    }
    
    const score = await securityAnalytics.getRiskScore(ip);
    const level = securityAnalytics.getRiskLevel(score);
    
    res.json({ 
      ip,
      score,
      level
    });
  } catch (error) {
    console.error('Error getting risk score:', error);
    res.status(500).json({ error: 'Failed to get risk score' });
  }
};

// Get events by IP
exports.getEventsByIP = async (req, res) => {
  try {
    const { ip } = req.query;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP is required' });
    }
    
    const events = await securityAnalytics.getEventsByIP(ip);
    
    res.json({ 
      ip,
      events
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
};

// Get security statistics
exports.getStatistics = async (req, res) => {
  try {
    const stats = await securityAnalytics.getStatistics();
    
    res.json({ 
      statistics: stats
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
}; 