const analyticsService = require('../services/analyticsService');
const { asyncHandler } = require('../middleware/error');

const analyticsController = {
  getUserActivity: asyncHandler(async (req, res) => {
    const { timeRange } = req.query;
    const userId = req.user._id;
    
    const activity = await analyticsService.getUserActivity(userId, timeRange);
    res.json(activity);
  }),

  getContentStatistics: asyncHandler(async (req, res) => {
    const { timeRange } = req.query;
    const statistics = await analyticsService.getContentStatistics(timeRange);
    res.json(statistics);
  }),

  getPerformanceMetrics: asyncHandler(async (req, res) => {
    const metrics = await analyticsService.getPerformanceMetrics();
    res.json(metrics);
  }),

  getDashboardData: asyncHandler(async (req, res) => {
    const { timeRange } = req.query;
    const userId = req.user._id;

    const [userActivity, contentStats, performanceMetrics] = await Promise.all([
      analyticsService.getUserActivity(userId, timeRange),
      analyticsService.getContentStatistics(timeRange),
      analyticsService.getPerformanceMetrics()
    ]);

    res.json({
      userActivity,
      contentStats,
      performanceMetrics
    });
  })
};

module.exports = analyticsController; 