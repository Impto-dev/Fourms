const { expect } = require('chai');
const nock = require('nock');
const { 
  handleGoogleLogin, 
  handleGithubLogin,
  validateSocialToken,
  createSocialUser
} = require('../src/services/socialAuth');

describe('Social Login Integration', () => {
  const mockGoogleUser = {
    sub: '123456789',
    email: 'google@example.com',
    name: 'Google User',
    picture: 'https://example.com/avatar.jpg'
  };

  const mockGithubUser = {
    id: 123456789,
    email: 'github@example.com',
    name: 'Github User',
    avatar_url: 'https://example.com/avatar.jpg'
  };

  beforeEach(() => {
    // Mock Google OAuth endpoint
    nock('https://oauth2.googleapis.com')
      .post('/token')
      .reply(200, {
        access_token: 'mock_google_token',
        id_token: 'mock_google_id_token'
      });

    nock('https://www.googleapis.com')
      .get('/oauth2/v3/userinfo')
      .reply(200, mockGoogleUser);

    // Mock Github OAuth endpoint
    nock('https://github.com')
      .post('/login/oauth/access_token')
      .reply(200, {
        access_token: 'mock_github_token'
      });

    nock('https://api.github.com')
      .get('/user')
      .reply(200, mockGithubUser);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Google Login', () => {
    it('should handle successful Google login', async () => {
      const result = await handleGoogleLogin('mock_auth_code');
      expect(result).to.have.property('user');
      expect(result.user.email).to.equal(mockGoogleUser.email);
      expect(result).to.have.property('token');
    });

    it('should handle invalid Google auth code', async () => {
      nock.cleanAll();
      nock('https://oauth2.googleapis.com')
        .post('/token')
        .reply(400, { error: 'invalid_grant' });

      try {
        await handleGoogleLogin('invalid_code');
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid Google auth code');
      }
    });
  });

  describe('Github Login', () => {
    it('should handle successful Github login', async () => {
      const result = await handleGithubLogin('mock_auth_code');
      expect(result).to.have.property('user');
      expect(result.user.email).to.equal(mockGithubUser.email);
      expect(result).to.have.property('token');
    });

    it('should handle invalid Github auth code', async () => {
      nock.cleanAll();
      nock('https://github.com')
        .post('/login/oauth/access_token')
        .reply(400, { error: 'bad_verification_code' });

      try {
        await handleGithubLogin('invalid_code');
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid Github auth code');
      }
    });
  });

  describe('Token Validation', () => {
    it('should validate Google token', async () => {
      const result = await validateSocialToken('google', 'mock_google_token');
      expect(result).to.deep.equal(mockGoogleUser);
    });

    it('should validate Github token', async () => {
      const result = await validateSocialToken('github', 'mock_github_token');
      expect(result).to.deep.equal(mockGithubUser);
    });

    it('should reject invalid provider', async () => {
      try {
        await validateSocialToken('invalid', 'mock_token');
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Invalid social provider');
      }
    });
  });

  describe('User Creation', () => {
    it('should create new user from social profile', async () => {
      const user = await createSocialUser('google', mockGoogleUser);
      expect(user).to.have.property('_id');
      expect(user.email).to.equal(mockGoogleUser.email);
      expect(user.social.google).to.equal(mockGoogleUser.sub);
    });

    it('should link existing user with social profile', async () => {
      // Create a user with the same email
      const existingUser = await User.create({
        email: mockGoogleUser.email,
        password: 'Password123!'
      });

      const user = await createSocialUser('google', mockGoogleUser);
      expect(user._id.toString()).to.equal(existingUser._id.toString());
      expect(user.social.google).to.equal(mockGoogleUser.sub);
    });

    it('should handle missing email in social profile', async () => {
      const profileWithoutEmail = { ...mockGoogleUser, email: null };
      try {
        await createSocialUser('google', profileWithoutEmail);
        throw new Error('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Email is required for social login');
      }
    });
  });
}); 