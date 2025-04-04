const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    refresh: `${API_BASE_URL}/auth/refresh`,
  },

  // User endpoints
  user: {
    profile: `${API_BASE_URL}/users/profile`,
    update: `${API_BASE_URL}/users/update`,
    delete: `${API_BASE_URL}/users/delete`,
  },

  // Forum endpoints
  forum: {
    threads: `${API_BASE_URL}/forum/threads`,
    posts: `${API_BASE_URL}/forum/posts`,
    categories: `${API_BASE_URL}/forum/categories`,
  },

  // Security endpoints
  security: {
    stats: `${API_BASE_URL}/security/stats`,
    events: `${API_BASE_URL}/security/events`,
    stream: `${API_BASE_URL}/security/events/stream`,
  },
};

export default API_ENDPOINTS; 