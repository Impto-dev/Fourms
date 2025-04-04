const User = require('../models/User');
const SocialLogin = require('../models/SocialLogin');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth callback
exports.googleCallback = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // Check if social login exists
    let socialLogin = await SocialLogin.findOne({
      provider: 'google',
      providerId: sub
    });

    if (socialLogin) {
      // Update existing social login
      socialLogin.email = email;
      socialLogin.displayName = name;
      socialLogin.avatar = picture;
      await socialLogin.save();

      // Get user
      const user = await User.findById(socialLogin.user);
      const token = generateToken(user);
      return res.json({ token, user });
    }

    // Check if user with this email exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        username: generateUsername(name),
        email,
        password: generateRandomPassword(),
        isVerified: true,
        avatar: picture
      });
      await user.save();
    }

    // Create social login
    socialLogin = new SocialLogin({
      user: user._id,
      provider: 'google',
      providerId: sub,
      email,
      displayName: name,
      avatar: picture
    });
    await socialLogin.save();

    const authToken = generateToken(user);
    res.json({ token: authToken, user });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Error authenticating with Google' });
  }
};

// GitHub OAuth callback
exports.githubCallback = async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, {
      headers: {
        Accept: 'application/json'
      }
    });

    const { access_token } = tokenResponse.data;

    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${access_token}`
      }
    });

    const { id, email, name, avatar_url } = userResponse.data;

    // Check if social login exists
    let socialLogin = await SocialLogin.findOne({
      provider: 'github',
      providerId: id.toString()
    });

    if (socialLogin) {
      // Update existing social login
      socialLogin.email = email;
      socialLogin.displayName = name;
      socialLogin.avatar = avatar_url;
      await socialLogin.save();

      // Get user
      const user = await User.findById(socialLogin.user);
      const token = generateToken(user);
      return res.json({ token, user });
    }

    // Check if user with this email exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        username: generateUsername(name || `github-${id}`),
        email,
        password: generateRandomPassword(),
        isVerified: true,
        avatar: avatar_url
      });
      await user.save();
    }

    // Create social login
    socialLogin = new SocialLogin({
      user: user._id,
      provider: 'github',
      providerId: id.toString(),
      email,
      displayName: name,
      avatar: avatar_url,
      accessToken: access_token
    });
    await socialLogin.save();

    const token = generateToken(user);
    res.json({ token, user });
  } catch (error) {
    console.error('GitHub login error:', error);
    res.status(500).json({ message: 'Error authenticating with GitHub' });
  }
};

// Helper functions
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const generateUsername = (name) => {
  const baseUsername = name.toLowerCase().replace(/\s+/g, '');
  return `${baseUsername}-${Math.random().toString(36).substr(2, 5)}`;
};

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
}; 