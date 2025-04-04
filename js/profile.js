// Profile functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const session = SessionManager.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Display username in header
    document.getElementById('usernameDisplay').textContent = session.username;

    // Load profile data
    loadProfileData(session);

    // Handle tab switching
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab
            button.classList.add('active');
            const tabId = button.dataset.tab + 'Tab';
            document.getElementById(tabId).classList.add('active');

            // Load tab content
            switch (button.dataset.tab) {
                case 'activity':
                    loadActivity();
                    break;
                case 'threads':
                    loadThreads();
                    break;
                case 'replies':
                    loadReplies();
                    break;
            }
        });
    });

    // Handle avatar edit
    document.getElementById('editAvatarBtn').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    // Here you would typically upload the image to your backend
                    // For now, we'll just update the preview
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        document.getElementById('profileAvatar').src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('Error uploading avatar:', error);
                    alert('Failed to upload avatar. Please try again.');
                }
            }
        };
        input.click();
    });

    // Handle profile settings form
    document.getElementById('profileSettingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            displayName: document.getElementById('displayName').value,
            email: document.getElementById('email').value,
            bio: document.getElementById('bio').value,
            signature: document.getElementById('signature').value
        };

        try {
            // Here you would typically make an API call to your backend
            // For now, we'll just update the session
            const updatedSession = {
                ...session,
                ...formData
            };
            SessionManager.updateSession(updatedSession);

            alert('Profile settings saved successfully!');
        } catch (error) {
            console.error('Error saving profile settings:', error);
            alert('Failed to save profile settings. Please try again.');
        }
    });

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await AuthService.logout();
            SessionManager.clearSession();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        }
    });
});

// Load profile data
function loadProfileData(session) {
    // Set username
    document.getElementById('profileUsername').textContent = session.username;

    // Set rank information
    const rankBadge = document.getElementById('rankBadge');
    const rankName = rankBadge.querySelector('.rank-name');
    const rankExpiry = document.getElementById('rankExpiry');

    if (session.rank) {
        rankName.textContent = session.rank.charAt(0).toUpperCase() + session.rank.slice(1);
        if (session.rankExpiry) {
            const expiryDate = new Date(session.rankExpiry);
            rankExpiry.textContent = `Expires: ${expiryDate.toLocaleDateString()}`;
        }
    } else {
        rankName.textContent = 'Member';
        rankExpiry.textContent = '';
    }

    // Set profile stats (mock data for now)
    document.getElementById('postCount').textContent = '42';
    document.getElementById('threadCount').textContent = '15';
    document.getElementById('likeCount').textContent = '128';

    // Set profile settings
    document.getElementById('displayName').value = session.displayName || session.username;
    document.getElementById('email').value = session.email || '';
    document.getElementById('bio').value = session.bio || '';
    document.getElementById('signature').value = session.signature || '';

    // Load initial tab content
    loadActivity();
}

// Load activity
function loadActivity() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';

    // Mock activity data
    const activities = [
        {
            type: 'thread',
            title: 'Welcome to the Forum!',
            date: '2024-04-01T12:00:00Z'
        },
        {
            type: 'reply',
            content: 'Thanks for the warm welcome!',
            date: '2024-04-01T13:30:00Z'
        },
        {
            type: 'like',
            content: 'Liked a post in "Getting Started"',
            date: '2024-04-02T09:15:00Z'
        }
    ];

    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        
        const content = document.createElement('div');
        content.className = 'activity-content';
        
        const date = document.createElement('div');
        date.className = 'activity-date';
        date.textContent = formatRelativeTime(activity.date);

        if (activity.type === 'thread') {
            content.innerHTML = `Created thread: <a href="thread.html?id=1">${activity.title}</a>`;
        } else if (activity.type === 'reply') {
            content.textContent = activity.content;
        } else {
            content.textContent = activity.content;
        }

        item.appendChild(content);
        item.appendChild(date);
        activityList.appendChild(item);
    });
}

// Load threads
function loadThreads() {
    const threadsList = document.getElementById('threadsList');
    threadsList.innerHTML = '';

    // Mock thread data
    const threads = [
        {
            id: 1,
            title: 'Welcome to the Forum!',
            date: '2024-04-01T12:00:00Z',
            replies: 5
        },
        {
            id: 2,
            title: 'Getting Started Guide',
            date: '2024-04-02T09:15:00Z',
            replies: 3
        }
    ];

    threads.forEach(thread => {
        const item = document.createElement('div');
        item.className = 'thread-item';
        
        const content = document.createElement('div');
        content.className = 'thread-content';
        content.innerHTML = `<a href="thread.html?id=${thread.id}">${thread.title}</a> (${thread.replies} replies)`;
        
        const date = document.createElement('div');
        date.className = 'thread-date';
        date.textContent = formatRelativeTime(thread.date);

        item.appendChild(content);
        item.appendChild(date);
        threadsList.appendChild(item);
    });
}

// Load replies
function loadReplies() {
    const repliesList = document.getElementById('repliesList');
    repliesList.innerHTML = '';

    // Mock reply data
    const replies = [
        {
            id: 1,
            threadId: 1,
            threadTitle: 'Welcome to the Forum!',
            content: 'Thanks for the warm welcome!',
            date: '2024-04-01T13:30:00Z'
        },
        {
            id: 2,
            threadId: 2,
            threadTitle: 'Getting Started Guide',
            content: 'This guide is very helpful!',
            date: '2024-04-02T10:45:00Z'
        }
    ];

    replies.forEach(reply => {
        const item = document.createElement('div');
        item.className = 'reply-item';
        
        const content = document.createElement('div');
        content.className = 'reply-content';
        content.innerHTML = `In <a href="thread.html?id=${reply.threadId}">${reply.threadTitle}</a>: ${reply.content}`;
        
        const date = document.createElement('div');
        date.className = 'reply-date';
        date.textContent = formatRelativeTime(reply.date);

        item.appendChild(content);
        item.appendChild(date);
        repliesList.appendChild(item);
    });
}

// Format date to relative time
function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
} 