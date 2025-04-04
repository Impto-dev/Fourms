const advancedRateLimit = require('../services/advancedRateLimit');
const { sendDiscordAlert } = require('../services/discordService');

// Get current rate limit thresholds
exports.getThresholds = async (req, res) => {
  try {
    const thresholds = advancedRateLimit.getCurrentThresholds();
    res.json({ thresholds });
  } catch (error) {
    console.error('Error getting thresholds:', error);
    res.status(500).json({ error: 'Failed to get thresholds' });
  }
};

// Update rate limit thresholds
exports.updateThresholds = async (req, res) => {
  try {
    const { loadFactor } = req.body;
    
    if (typeof loadFactor !== 'number' || loadFactor < 0 || loadFactor > 1) {
      return res.status(400).json({ error: 'Invalid load factor' });
    }
    
    await advancedRateLimit.updateThresholds(loadFactor);
    const thresholds = advancedRateLimit.getCurrentThresholds();
    
    res.json({ 
      message: 'Thresholds updated successfully',
      thresholds 
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({ error: 'Failed to update thresholds' });
  }
};

// Block IP based on geographic location
exports.blockGeographicIP = async (req, res) => {
  try {
    const { ip, reason, duration } = req.body;
    
    if (!ip || !reason) {
      return res.status(400).json({ error: 'IP and reason are required' });
    }
    
    await advancedRateLimit.blockGeographicIP(ip, reason, duration);
    
    res.json({ 
      message: 'IP blocked successfully',
      ip,
      reason,
      duration: duration || 86400
    });
  } catch (error) {
    console.error('Error blocking IP:', error);
    res.status(500).json({ error: 'Failed to block IP' });
  }
};

// Get IP pattern analysis
exports.getPatternAnalysis = async (req, res) => {
  try {
    const { ip, type } = req.query;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP is required' });
    }
    
    const pattern = await advancedRateLimit.analyzePattern(ip, type || 'default');
    
    res.json({ 
      ip,
      type: type || 'default',
      pattern
    });
  } catch (error) {
    console.error('Error analyzing pattern:', error);
    res.status(500).json({ error: 'Failed to analyze pattern' });
  }
};

// Get geographic block status
exports.getGeographicBlockStatus = async (req, res) => {
  try {
    const { ip } = req.query;
    
    if (!ip) {
      return res.status(400).json({ error: 'IP is required' });
    }
    
    const status = await advancedRateLimit.checkGeographicBlock(ip);
    
    res.json({ 
      ip,
      status
    });
  } catch (error) {
    console.error('Error getting geographic block status:', error);
    res.status(500).json({ error: 'Failed to get block status' });
  }
}; 