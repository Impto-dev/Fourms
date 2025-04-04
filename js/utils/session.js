// Session Management Utility
const SessionManager = {
    // Session timeout in milliseconds (24 hours)
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000,

    // Get current user session
    getSession() {
        const userData = localStorage.getItem('user');
        if (!userData) return null;

        try {
            const session = JSON.parse(userData);
            return this.isSessionValid(session) ? session : null;
        } catch (error) {
            console.error('Error parsing session data:', error);
            return null;
        }
    },

    // Check if session is valid
    isSessionValid(session) {
        if (!session || !session.timestamp) return false;
        
        const sessionAge = new Date().getTime() - session.timestamp;
        return sessionAge < this.SESSION_TIMEOUT;
    },

    // Create new session
    createSession(userData) {
        const session = {
            ...userData,
            loggedIn: true,
            timestamp: new Date().getTime()
        };
        
        localStorage.setItem('user', JSON.stringify(session));
        return session;
    },

    // Update session
    updateSession(updates) {
        const session = this.getSession();
        if (!session) return null;

        const updatedSession = {
            ...session,
            ...updates,
            timestamp: new Date().getTime()
        };

        localStorage.setItem('user', JSON.stringify(updatedSession));
        return updatedSession;
    },

    // Clear session
    clearSession() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    },

    // Check if user is logged in
    isLoggedIn() {
        return this.getSession() !== null;
    },

    // Get current user
    getCurrentUser() {
        const session = this.getSession();
        return session ? {
            email: session.email,
            username: session.username
        } : null;
    }
};

// Export for use in other files
window.SessionManager = SessionManager; 