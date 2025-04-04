import api from '../utils/api.js';
import { showLoading, hideLoading, showError, showSuccess } from '../utils/ui.js';

// DOM Elements
const usernameDisplay = document.getElementById('usernameDisplay');
const newThreadBtn = document.getElementById('newThreadBtn');
const categoriesContainer = document.querySelector('.categories');
const newThreadModal = document.getElementById('newThreadModal');
const newThreadForm = document.getElementById('newThreadForm');

// Initialize forum
async function initForum() {
    try {
        // Check authentication
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.loggedIn) {
            window.location.href = 'login.html';
            return;
        }

        // Update username display
        usernameDisplay.textContent = user.username;

        // Load categories and threads
        await loadCategories();
    } catch (error) {
        showError('Failed to initialize forum. Please try again.');
        console.error('Forum initialization error:', error);
    }
}

// Load categories and threads
async function loadCategories() {
    const loadingSpinner = showLoading(categoriesContainer);
    
    try {
        const categories = await api.getCategories();
        categoriesContainer.innerHTML = ''; // Clear existing content

        categories.forEach(category => {
            const categoryElement = createCategoryElement(category);
            categoriesContainer.appendChild(categoryElement);
        });
    } catch (error) {
        showError('Failed to load categories. Please try again.');
        console.error('Categories loading error:', error);
    } finally {
        hideLoading(loadingSpinner);
    }
}

// Create category element
function createCategoryElement(category) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category';
    
    categoryDiv.innerHTML = `
        <div class="category-header">
            <h3>${category.name}</h3>
            <span class="thread-count">${category.threadCount} threads</span>
        </div>
        <div class="threads">
            ${category.threads.map(thread => createThreadElement(thread)).join('')}
        </div>
    `;
    
    return categoryDiv;
}

// Create thread element
function createThreadElement(thread) {
    return `
        <div class="thread">
            <div class="thread-info">
                <h4><a href="thread.html?id=${thread.id}">${thread.title}</a></h4>
                <p>Started by <a href="profile.html?user=${thread.author.username}">${thread.author.username}</a> • ${formatTimeAgo(thread.createdAt)}</p>
            </div>
            <div class="thread-stats">
                <span>${thread.replyCount} replies</span>
                <span>${thread.viewCount} views</span>
            </div>
        </div>
    `;
}

// Format time ago
function formatTimeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    let interval = seconds / 31536000;

    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return Math.floor(seconds) + ' seconds ago';
}

// Handle new thread button click
newThreadBtn?.addEventListener('click', () => {
    newThreadModal.style.display = 'block';
});

// Handle new thread form submission
newThreadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        title: newThreadForm.title.value,
        content: newThreadForm.content.value,
        category: newThreadForm.category.value
    };

    const loadingSpinner = showLoading(newThreadForm);
    
    try {
        const response = await api.createThread(formData);
        newThreadModal.style.display = 'none';
        newThreadForm.reset();
        showSuccess('Thread created successfully!');
        await loadCategories(); // Refresh the thread list
    } catch (error) {
        showError(error.message || 'Failed to create thread. Please try again.');
    } finally {
        hideLoading(loadingSpinner);
    }
});

// Handle logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await api.logout();
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    } catch (error) {
        showError('Failed to logout. Please try again.');
    }
});

// Initialize forum when DOM is loaded
document.addEventListener('DOMContentLoaded', initForum); 