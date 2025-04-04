import React from 'react';
import { Box, Button, Typography, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useSnackbar } from 'notistack';
import { useDispatch } from 'react-redux';
import { login } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const SocialLogin = () => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      // Initialize Google OAuth client
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: async (response) => {
          if (response.error) {
            throw new Error(response.error);
          }

          // Send token to backend
          const result = await dispatch(login({
            token: response.access_token,
            provider: 'google'
          })).unwrap();

          if (result.token) {
            enqueueSnackbar('Logged in successfully', { variant: 'success' });
            navigate('/');
          }
        }
      });

      client.requestAccessToken();
    } catch (error) {
      console.error('Google login error:', error);
      enqueueSnackbar('Error logging in with Google', { variant: 'error' });
    }
  };

  const handleGitHubLogin = async () => {
    try {
      // Redirect to GitHub OAuth page
      const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/github/callback`;
      const scope = 'user:email';
      
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    } catch (error) {
      console.error('GitHub login error:', error);
      enqueueSnackbar('Error logging in with GitHub', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Divider sx={{ my: 2 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          fullWidth
          sx={{
            backgroundColor: 'white',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          Continue with Google
        </Button>

        <Button
          variant="outlined"
          startIcon={<GitHubIcon />}
          onClick={handleGitHubLogin}
          fullWidth
          sx={{
            backgroundColor: 'white',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            }
          }}
        >
          Continue with GitHub
        </Button>
      </Box>
    </Box>
  );
};

export default SocialLogin; 