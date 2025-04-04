// Password utility functions
const PasswordUtils = {
    // Generate a random salt
    generateSalt: function() {
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    // Hash password with salt (client-side)
    hashPassword: async function(password, salt) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // Verify password (client-side)
    verifyPassword: async function(password, salt, storedHash) {
        const hash = await this.hashPassword(password, salt);
        return hash === storedHash;
    }
};

// Export for use in other files
window.PasswordUtils = PasswordUtils; 