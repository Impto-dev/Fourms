import api from './api';

const analyticsService = {
  getUserActivity: async (timeRange = '7d') => {
    const response = await api.get(`/analytics/user-activity?timeRange=${timeRange}`);
    return response.data;
  },

  getContentStatistics: async (timeRange = '7d') => {
    const response = await api.get(`/analytics/content-stats?timeRange=${timeRange}`);
    return response.data;
  },

  getPerformanceMetrics: async () => {
    const response = await api.get('/analytics/performance');
    return response.data;
  },

  getDashboardData: async (timeRange = '7d') => {
    const response = await api.get(`/analytics/dashboard?timeRange=${timeRange}`);
    return response.data;
  }
};

export default analyticsService; 