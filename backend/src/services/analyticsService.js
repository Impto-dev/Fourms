const { Thread, Post, User, Notification } = require('../models');
const redis = require('../config/redis');

class AnalyticsService {
  constructor() {
    this.redis = redis;
  }

  async getUserActivity(userId, timeRange = '7d') {
    const [threads, posts, notifications] = await Promise.all([
      Thread.countDocuments({ author: userId, createdAt: { $gte: this.getDateFromRange(timeRange) } }),
      Post.countDocuments({ author: userId, createdAt: { $gte: this.getDateFromRange(timeRange) } }),
      Notification.countDocuments({ userId, createdAt: { $gte: this.getDateFromRange(timeRange) } })
    ]);

    return {
      threads,
      posts,
      notifications,
      totalActivity: threads + posts
    };
  }

  async getContentStatistics(timeRange = '7d') {
    const [threads, posts, users] = await Promise.all([
      Thread.countDocuments({ createdAt: { $gte: this.getDateFromRange(timeRange) } }),
      Post.countDocuments({ createdAt: { $gte: this.getDateFromRange(timeRange) } }),
      User.countDocuments({ createdAt: { $gte: this.getDateFromRange(timeRange) } })
    ]);

    return {
      threads,
      posts,
      users,
      averagePostsPerThread: threads > 0 ? (posts / threads).toFixed(2) : 0
    };
  }

  async getPerformanceMetrics() {
    const cacheKey = 'performance_metrics';
    const cachedMetrics = await this.redis.get(cacheKey);

    if (cachedMetrics) {
      return JSON.parse(cachedMetrics);
    }

    const metrics = {
      responseTime: await this.calculateAverageResponseTime(),
      errorRate: await this.calculateErrorRate(),
      activeUsers: await this.getActiveUsersCount(),
      systemLoad: await this.getSystemLoad()
    };

    await this.redis.set(cacheKey, JSON.stringify(metrics), 'EX', 300); // Cache for 5 minutes
    return metrics;
  }

  async calculateAverageResponseTime() {
    // Implementation would depend on your monitoring system
    // This is a placeholder that would be replaced with actual metrics
    return {
      api: 150, // ms
      database: 50, // ms
      cache: 10 // ms
    };
  }

  async calculateErrorRate() {
    // Implementation would depend on your error tracking system
    return {
      api: 0.5, // %
      database: 0.1, // %
      cache: 0.05 // %
    };
  }

  async getActiveUsersCount() {
    const activeThreshold = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes
    return User.countDocuments({ lastActive: { $gte: activeThreshold } });
  }

  async getSystemLoad() {
    // Implementation would depend on your system monitoring
    return {
      cpu: 45, // %
      memory: 60, // %
      disk: 30 // %
    };
  }

  getDateFromRange(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return new Date(now - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now - 7 * 24 * 60 * 60 * 1000);
    }
  }
}

module.exports = new AnalyticsService(); 