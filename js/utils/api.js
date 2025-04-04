const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token from cookies
function getAuthToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth_token') {
            return value;
        }
    }
    return null;
}

// Helper function to handle API responses
async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
}

// API request wrapper
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include'
    });

    return handleResponse(response);
}

// API methods
const api = {
    // Auth endpoints
    login: (credentials) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),
    register: (userData) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),
    logout: () => apiRequest('/auth/logout', { method: 'POST' }),

    // User endpoints
    getProfile: () => apiRequest('/users/profile'),
    updateProfile: (profileData) => apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
    }),

    // Thread endpoints
    getThreads: () => apiRequest('/threads'),
    getThread: (id) => apiRequest(`/threads/${id}`),
    createThread: (threadData) => apiRequest('/threads', {
        method: 'POST',
        body: JSON.stringify(threadData)
    }),
    updateThread: (id, threadData) => apiRequest(`/threads/${id}`, {
        method: 'PUT',
        body: JSON.stringify(threadData)
    }),
    deleteThread: (id) => apiRequest(`/threads/${id}`, { method: 'DELETE' }),

    // Post endpoints
    getPosts: (threadId) => apiRequest(`/posts?threadId=${threadId}`),
    createPost: (postData) => apiRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(postData)
    }),
    updatePost: (id, postData) => apiRequest(`/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(postData)
    }),
    deletePost: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),

    // Payment endpoints
    createCheckoutSession: (rankId) => apiRequest('/payments/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ rankId })
    }),
    getRanks: () => apiRequest('/payments/ranks')
};

export default api; 