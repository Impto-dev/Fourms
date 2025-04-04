import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moderationService from '../../services/moderationService';

const ModerationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moderationQueue, setModerationQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedAction, setSelectedAction] = useState('approve');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [queue, statistics] = await Promise.all([
          moderationService.getModerationQueue(),
          moderationService.getModerationStats()
        ]);
        setModerationQueue(queue);
        setStats(statistics);
        setLoading(false);
      } catch (err) {
        setError('Failed to load moderation data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBulkAction = async (contentIds) => {
    try {
      await moderationService.bulkModerate(contentIds, selectedAction);
      // Refresh the queue after action
      const updatedQueue = await moderationService.getModerationQueue();
      setModerationQueue(updatedQueue);
    } catch (err) {
      setError('Failed to perform bulk action');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Moderation Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thread Statistics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.threads}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Post Statistics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.posts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Moderation Queue */}
        <Grid item xs={12}>
          <Paper>
            <Box p={2}>
              <Typography variant="h6" gutterBottom>
                Moderation Queue
              </Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <FormControl sx={{ minWidth: 120, mr: 2 }}>
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    label="Action"
                  >
                    <MenuItem value="approve">Approve</MenuItem>
                    <MenuItem value="reject">Reject</MenuItem>
                    <MenuItem value="delete">Delete</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleBulkAction(moderationQueue.map(item => item._id))}
                >
                  Apply to All
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {moderationQueue.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>{item.author?.username}</TableCell>
                        <TableCell>{item.status}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleBulkAction([item._id])}
                          >
                            {selectedAction}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModerationDashboard; 