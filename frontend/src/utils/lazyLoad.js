import React, { Suspense, lazy } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LazyLoad = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);

  const defaultFallback = (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="200px"
    >
      <CircularProgress />
    </Box>
  );

  return (props) => (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const handleError = (error) => {
      setHasError(true);
      setError(error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={3}
      >
        <Typography variant="h6" color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {error?.message || 'An unexpected error occurred'}
        </Typography>
      </Box>
    );
  }

  return children;
};

export default LazyLoad; 