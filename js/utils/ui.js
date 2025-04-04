// Loading state management
export function showLoading(element) {
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = '<div class="spinner"></div>';
    element.appendChild(loadingSpinner);
    return loadingSpinner;
}

export function hideLoading(loadingElement) {
    if (loadingElement && loadingElement.parentNode) {
        loadingElement.parentNode.removeChild(loadingElement);
    }
}

// Error message handling
export function showError(message, container) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    if (container) {
        container.appendChild(errorElement);
        setTimeout(() => {
            container.removeChild(errorElement);
        }, 5000);
    } else {
        document.body.appendChild(errorElement);
        setTimeout(() => {
            document.body.removeChild(errorElement);
        }, 5000);
    }
}

// Success message handling
export function showSuccess(message, container) {
    const successElement = document.createElement('div');
    successElement.className = 'success-message';
    successElement.textContent = message;
    
    if (container) {
        container.appendChild(successElement);
        setTimeout(() => {
            container.removeChild(successElement);
        }, 3000);
    } else {
        document.body.appendChild(successElement);
        setTimeout(() => {
            document.body.removeChild(successElement);
        }, 3000);
    }
}

// Form validation helper
export function validateForm(formData, rules) {
    const errors = {};
    
    for (const [field, value] of Object.entries(formData)) {
        if (rules[field]) {
            const fieldRules = rules[field];
            
            if (fieldRules.required && !value) {
                errors[field] = 'This field is required';
            }
            
            if (fieldRules.minLength && value.length < fieldRules.minLength) {
                errors[field] = `Minimum length is ${fieldRules.minLength} characters`;
            }
            
            if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
                errors[field] = `Maximum length is ${fieldRules.maxLength} characters`;
            }
            
            if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
                errors[field] = fieldRules.message || 'Invalid format';
            }
        }
    }
    
    return errors;
} 