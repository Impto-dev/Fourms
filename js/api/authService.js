// Authentication Service
const AuthService = {
    // Base URL for API endpoints
    baseUrl: 'http://localhost:3000/api',

    // Register a new user
    async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    // Login user
    async login(credentials) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Discord OAuth login
    async discordLogin(code) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/discord/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                throw new Error('Discord login failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Discord login error:', error);
            throw error;
        }
    },

    // Logout user
    async logout() {
        try {
            const response = await fetch(`${this.baseUrl}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    },

    // Check if user is authenticated
    async checkAuth() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return false;

            const response = await fetch(`${this.baseUrl}/auth/check`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }
};

// Export for use in other files
window.AuthService = AuthService; 