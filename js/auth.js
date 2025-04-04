import api from '../utils/api.js';
import { showLoading, hideLoading, showError, showSuccess, validateForm } from '../utils/ui.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');

// Form validation rules
const loginRules = {
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },
    password: {
        required: true,
        minLength: 6,
        message: 'Password must be at least 6 characters long'
    }
};

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const formData = {
        email: form.email.value,
        password: form.password.value
    };

    // Validate form
    const errors = validateForm(formData, loginRules);
    if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, message]) => {
            const input = form[field];
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.textContent = message;
            input.classList.add('invalid-input');
            input.parentNode.appendChild(errorDiv);
        });
        return;
    }

    const loadingSpinner = showLoading(form);
    
    try {
        const response = await api.login(formData);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        
        showSuccess('Login successful! Redirecting...');
        setTimeout(() => {
            window.location.href = '../pages/forum.html';
        }, 1500);
    } catch (error) {
        showError(error.message || 'Login failed. Please try again.');
    } finally {
        hideLoading(loadingSpinner);
    }
});

// Handle Discord login
document.getElementById('discordLogin')?.addEventListener('click', () => {
    window.location.href = '/api/auth/discord';
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.loggedIn) {
        window.location.href = '../pages/forum.html';
    }
}); 