import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, CircularProgress, Typography } from '@mui/material';
import { login } from '../../store/slices/authSlice';
import { useSnackbar } from 'notistack';

const GitHubCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');

        if (!code) {
          throw new Error('No code received from GitHub');
        }

        // Send code to backend
        const result = await dispatch(login({
          code,
          provider: 'github'
        })).unwrap();

        if (result.token) {
          enqueueSnackbar('Logged in successfully', { variant: 'success' });
          navigate('/');
        }
      } catch (error) {
        console.error('GitHub callback error:', error);
        enqueueSnackbar('Error authenticating with GitHub', { variant: 'error' });
        navigate('/login');
      }
    };

    handleCallback();
  }, [location, dispatch, navigate, enqueueSnackbar]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2
      }}
    >
      <CircularProgress />
      <Typography variant="body1">
        Authenticating with GitHub...
      </Typography>
    </Box>
  );
};

export default GitHubCallback; 