import api from './api';

const moderationService = {
  analyzeContent: async (content) => {
    const response = await api.post('/moderation/analyze', { content });
    return response.data;
  },

  getModerationQueue: async () => {
    const response = await api.get('/moderation/queue');
    return response.data;
  },

  bulkModerate: async (contentIds, action) => {
    const response = await api.post('/moderation/bulk', { contentIds, action });
    return response.data;
  },

  moderateThread: async (threadId, action) => {
    const response = await api.post(`/moderation/threads/${threadId}`, { action });
    return response.data;
  },

  moderatePost: async (postId, action) => {
    const response = await api.post(`/moderation/posts/${postId}`, { action });
    return response.data;
  },

  getModerationStats: async () => {
    const response = await api.get('/moderation/stats');
    return response.data;
  }
};

export default moderationService; 