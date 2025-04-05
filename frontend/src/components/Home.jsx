import React from 'react';
import { Box, Container, Typography, Grid, Paper, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Welcome to the Forum
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Latest Discussions
              </Typography>
              <Typography variant="body1" paragraph>
                Join the conversation and share your thoughts with the community.
              </Typography>
              <Button
                component={Link}
                to="/threads"
                variant="contained"
                color="primary"
                fullWidth
              >
                Browse Threads
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Get Started
              </Typography>
              <Typography variant="body1" paragraph>
                Create an account to participate in discussions and connect with others.
              </Typography>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                color="secondary"
                fullWidth
              >
                Register Now
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Home; 