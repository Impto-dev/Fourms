// Discord OAuth2 Configuration
const DISCORD_CLIENT_ID = '1046881936628535358'; // Replace with your Discord application client ID
const DISCORD_REDIRECT_URI = 'http://localhost:3000/auth/discord/callback'; // Replace with your redirect URI
const DISCORD_SCOPE = 'identify email';

// Discord Login Button Handler
document.getElementById('discordLogin').addEventListener('click', () => {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(DISCORD_SCOPE)}`;
    window.location.href = authUrl;
});

// Handle Discord OAuth callback
async function handleDiscordCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        try {
            // Here you would typically make an API call to your backend
            // to exchange the code for Discord tokens
            console.log('Discord auth code:', code);
            
            // Simulate successful Discord login
            localStorage.setItem('user', JSON.stringify({
                email: 'discord@example.com', // This would come from Discord API
                loggedIn: true,
                timestamp: new Date().getTime(),
                discord: true
            }));

            // Redirect to forum page
            window.location.href = 'forum.html';
        } catch (error) {
            console.error('Discord authentication failed:', error);
            alert('Discord authentication failed. Please try again.');
        }
    }
}

// Check if we're on the callback page
if (window.location.pathname.includes('auth/discord/callback')) {
    handleDiscordCallback();
} 