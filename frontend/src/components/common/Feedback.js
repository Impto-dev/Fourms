import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Snackbar,
  Slide,
} from '@mui/material';
import { useAnimation } from '../../utils/animations';

const Feedback = ({
  loading,
  error,
  success,
  loadingMessage = 'Loading...',
  errorMessage,
  successMessage,
  onClose,
}) => {
  const { animationStyle: slideInStyle } = useAnimation('slideIn');

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={3}
        sx={slideInStyle}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" mt={2}>
          {loadingMessage}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        onClose={onClose}
        sx={{
          mb: 2,
          ...slideInStyle,
        }}
      >
        {errorMessage || 'An error occurred. Please try again.'}
      </Alert>
    );
  }

  if (success) {
    return (
      <Snackbar
        open={true}
        autoHideDuration={6000}
        onClose={onClose}
        TransitionComponent={Slide}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={onClose}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage || 'Operation completed successfully.'}
        </Alert>
      </Snackbar>
    );
  }

  return null;
};

export default Feedback; 