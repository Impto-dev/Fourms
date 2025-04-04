import api from '../utils/api.js';
import { showLoading, hideLoading, showError, showSuccess, validateForm } from '../utils/ui.js';

// Form validation rules
const registerRules = {
    username: {
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: /^[a-zA-Z0-9_]+$/,
        message: 'Username must be 3-20 characters and can only contain letters, numbers, and underscores'
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
    },
    password: {
        required: true,
        minLength: 8,
        pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
        message: 'Password must be at least 8 characters and contain at least one number, one uppercase and one lowercase letter'
    },
    confirmPassword: {
        required: true,
        message: 'Please confirm your password'
    }
};

// Handle registration form submission
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const formData = {
        username: form.username.value,
        email: form.email.value,
        password: form.password.value,
        confirmPassword: form.confirmPassword.value
    };

    // Validate form
    const errors = validateForm(formData, registerRules);
    
    // Additional validation for password match
    if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }

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
        // Remove confirmPassword before sending to API
        const { confirmPassword, ...registrationData } = formData;
        
        const response = await api.register(registrationData);
        
        showSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
    } finally {
        hideLoading(loadingSpinner);
    }
});

// Handle Discord registration
document.getElementById('discordRegister')?.addEventListener('click', () => {
    window.location.href = '/api/auth/discord/register';
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.loggedIn) {
        window.location.href = 'forum.html';
    }
}); 