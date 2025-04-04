const rateLimitMonitor = require('../services/rateLimitMonitor');

const dashboardController = {
  // Get overall violation statistics
  async getViolationStats(req, res) {
    try {
      const periods = ['hourly', 'daily', 'weekly'];
      const types = ['2fa_setup', '2fa_verify', '2fa_backup', '2fa_recovery', '2fa_disable'];
      
      const stats = {};
      
      // Get stats for each period and type
      for (const period of periods) {
        stats[period] = {};
        for (const type of types) {
          stats[period][type] = await rateLimitMonitor.getViolationStats(type, period);
        }
      }

      // Get currently blocked IPs
      const blockedIPs = await rateLimitMonitor.getBlockedIPs();

      res.json({
        stats,
        blockedIPs,
        thresholds: rateLimitMonitor.violationThresholds
      });
    } catch (error) {
      console.error('Error getting violation stats:', error);
      res.status(500).json({ message: 'Error getting violation statistics' });
    }
  },

  // Get detailed violation history
  async getViolationHistory(req, res) {
    try {
      const { type, period = 'daily', limit = 100 } = req.query;
      const violations = await rateLimitMonitor.getViolationHistory(type, period, parseInt(limit));
      res.json(violations);
    } catch (error) {
      console.error('Error getting violation history:', error);
      res.status(500).json({ message: 'Error getting violation history' });
    }
  },

  // Get IP-specific statistics
  async getIPStats(req, res) {
    try {
      const { ip } = req.params;
      const stats = await rateLimitMonitor.getIPStats(ip);
      res.json(stats);
    } catch (error) {
      console.error('Error getting IP stats:', error);
      res.status(500).json({ message: 'Error getting IP statistics' });
    }
  },

  // Unblock an IP address
  async unblockIP(req, res) {
    try {
      const { ip } = req.params;
      await rateLimitMonitor.unblockIP(ip);
      res.json({ message: 'IP unblocked successfully' });
    } catch (error) {
      console.error('Error unblocking IP:', error);
      res.status(500).json({ message: 'Error unblocking IP' });
    }
  },

  // Update rate limit thresholds
  async updateThresholds(req, res) {
    try {
      const { hourly, daily, weekly } = req.body;
      await rateLimitMonitor.updateThresholds({ hourly, daily, weekly });
      res.json({ message: 'Thresholds updated successfully' });
    } catch (error) {
      console.error('Error updating thresholds:', error);
      res.status(500).json({ message: 'Error updating thresholds' });
    }
  }
};

module.exports = dashboardController; 