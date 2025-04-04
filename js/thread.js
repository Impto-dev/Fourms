// Thread functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const session = SessionManager.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Display username
    document.getElementById('usernameDisplay').textContent = session.username;

    // Get thread ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const threadId = urlParams.get('id');

    if (!threadId) {
        window.location.href = 'forum.html';
        return;
    }

    // Load thread data
    loadThread(threadId);

    // Handle reply submission
    document.getElementById('replyForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const content = document.getElementById('replyContent').value;

        try {
            // Here you would typically make an API call to your backend
            // For now, we'll just simulate posting a reply
            console.log('Posting reply:', { threadId, content });

            // Clear the form
            e.target.reset();

            // Reload the thread to show the new reply
            loadThread(threadId);
        } catch (error) {
            console.error('Error posting reply:', error);
            alert('Failed to post reply. Please try again.');
        }
    });

    // Handle post actions
    document.getElementById('likeBtn').addEventListener('click', () => {
        // Implement like functionality
        console.log('Liking post');
    });

    document.getElementById('quoteBtn').addEventListener('click', () => {
        // Implement quote functionality
        const content = document.getElementById('originalPostContent').textContent;
        document.getElementById('replyContent').value = `> ${content}\n\n`;
    });

    document.getElementById('reportBtn').addEventListener('click', () => {
        // Implement report functionality
        console.log('Reporting post');
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

// Load thread data
async function loadThread(threadId) {
    try {
        // Here you would typically make an API call to your backend
        // For now, we'll use mock data
        const mockThread = {
            id: threadId,
            title: 'Welcome to the Forum!',
            author: 'Admin',
            date: '2024-04-01T12:00:00Z',
            content: 'Welcome to our new forum! This is a place where you can discuss various topics, share your thoughts, and connect with other members of our community.',
            replies: [
                {
                    id: 1,
                    author: 'User1',
                    date: '2024-04-01T13:30:00Z',
                    content: 'Thanks for creating this forum! Looking forward to participating in discussions.'
                },
                {
                    id: 2,
                    author: 'User2',
                    date: '2024-04-02T09:15:00Z',
                    content: 'Great initiative! The forum looks amazing.'
                }
            ]
        };

        // Update thread information
        document.getElementById('threadTitle').textContent = mockThread.title;
        document.getElementById('threadAuthor').textContent = mockThread.author;
        document.getElementById('threadDate').textContent = formatRelativeTime(mockThread.date);
        document.getElementById('originalAuthor').textContent = mockThread.author;
        document.getElementById('originalPostDate').textContent = formatRelativeTime(mockThread.date);
        document.getElementById('originalPostContent').textContent = mockThread.content;

        // Update author links
        document.getElementById('threadAuthor').href = `profile.html?user=${mockThread.author}`;
        document.getElementById('originalAuthor').href = `profile.html?user=${mockThread.author}`;

        // Load replies
        const repliesContainer = document.getElementById('replies');
        repliesContainer.innerHTML = '';

        mockThread.replies.forEach(reply => {
            const replyElement = createReplyElement(reply);
            repliesContainer.appendChild(replyElement);
        });

    } catch (error) {
        console.error('Error loading thread:', error);
        alert('Failed to load thread. Please try again later.');
    }
}

// Create reply element
function createReplyElement(reply) {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
        <div class="post-author">
            <img src="../assets/images/default-avatar.png" alt="Avatar" class="avatar">
            <div class="author-info">
                <a href="profile.html?user=${reply.author}">${reply.author}</a>
                <span class="post-date">${formatRelativeTime(reply.date)}</span>
            </div>
        </div>
        <div class="post-content">${reply.content}</div>
        <div class="post-actions">
            <button class="btn small like-btn">Like</button>
            <button class="btn small quote-btn">Quote</button>
            <button class="btn small report-btn">Report</button>
        </div>
    `;

    // Add event listeners to reply actions
    div.querySelector('.like-btn').addEventListener('click', () => {
        console.log('Liking reply:', reply.id);
    });

    div.querySelector('.quote-btn').addEventListener('click', () => {
        const content = reply.content;
        document.getElementById('replyContent').value = `> ${content}\n\n`;
    });

    div.querySelector('.report-btn').addEventListener('click', () => {
        console.log('Reporting reply:', reply.id);
    });

    return div;
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