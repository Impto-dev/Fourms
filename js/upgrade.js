// Upgrade functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const session = SessionManager.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    // Display username
    document.getElementById('usernameDisplay').textContent = session.username;

    // Rank prices
    const rankPrices = {
        premium: 4.99,
        vip: 9.99,
        elite: 19.99
    };

    // Rank names
    const rankNames = {
        premium: 'Premium',
        vip: 'VIP',
        elite: 'Elite'
    };

    // Modal elements
    const modal = document.getElementById('paymentModal');
    const closeBtn = document.querySelector('.close');
    const selectedRankName = document.getElementById('selectedRankName');
    const totalAmount = document.getElementById('totalAmount');

    // Handle upgrade button clicks
    document.querySelectorAll('.upgrade-btn').forEach(button => {
        button.addEventListener('click', () => {
            const rank = button.dataset.rank;
            selectedRankName.textContent = rankNames[rank];
            totalAmount.textContent = `$${rankPrices[rank]}`;
            modal.style.display = 'block';
        });
    });

    // Close modal when clicking the close button
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle payment form submission
    document.getElementById('paymentForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const cardNumber = document.getElementById('cardNumber').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const cvv = document.getElementById('cvv').value;
        const cardName = document.getElementById('cardName').value;
        const selectedRank = selectedRankName.textContent.toLowerCase();

        try {
            // Here you would typically make an API call to your backend
            // For now, we'll just simulate the payment process
            console.log('Processing payment:', {
                rank: selectedRank,
                amount: rankPrices[selectedRank],
                cardNumber,
                expiryDate,
                cvv,
                cardName
            });

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Update user's rank
            const updatedSession = {
                ...session,
                rank: selectedRank,
                rankExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
            };
            SessionManager.updateSession(updatedSession);

            // Show success message
            alert(`Congratulations! You are now a ${rankNames[selectedRank]} member!`);
            
            // Close modal
            modal.style.display = 'none';
            
            // Redirect to profile page
            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Payment failed:', error);
            alert('Payment failed. Please try again or contact support.');
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

    // Format card number input
    document.getElementById('cardNumber').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Format expiry date input
    document.getElementById('expiryDate').addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });

    // Format CVV input
    document.getElementById('cvv').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
    });
}); 