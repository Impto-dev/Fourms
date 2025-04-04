const express = require('express');
const router = express.Router();
const socialLoginController = require('../controllers/socialLoginController');

// Google OAuth callback
router.post('/google', socialLoginController.googleCallback);

// GitHub OAuth callback
router.post('/github', socialLoginController.githubCallback);

module.exports = router; 