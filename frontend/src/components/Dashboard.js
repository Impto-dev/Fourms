import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [violations, setViolations] = useState([]);
  const [selectedIP, setSelectedIP] = useState('');
  const [ipStats, setIpStats] = useState(null);
  const [thresholds, setThresholds] = useState({
    hourly: 10,
    daily: 30,
    weekly: 100
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkPermissions();
    fetchStats();
  }, []);

  const checkPermissions = async () => {
    try {
      const response = await fetch('/api/dashboard/access/me/permission?permission=view');
      const data = await response.json();
      
      if (!data.hasPermission) {
        navigate('/'); // Redirect to home if no permission
        return;
      }

      // Check other permissions
      const permissionsResponse = await fetch('/api/dashboard/access/me');
      const permissionsData = await permissionsResponse.json();
      setUserPermissions(permissionsData.permissions);
    } catch (err) {
      navigate('/'); // Redirect to home if error
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data.stats);
      setThresholds(data.thresholds);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch statistics');
      setLoading(false);
    }
  };

  const fetchViolations = async (type, period) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/violations?type=${type}&period=${period}`);
      const data = await response.json();
      setViolations(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch violations');
      setLoading(false);
    }
  };

  const fetchIpStats = async (ip) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/ip/${ip}`);
      const data = await response.json();
      setIpStats(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch IP statistics');
      setLoading(false);
    }
  };

  const handleUnblockIP = async (ip) => {
    try {
      await fetch(`/api/dashboard/ip/${ip}/unblock`, { method: 'POST' });
      fetchStats(); // Refresh stats after unblocking
    } catch (err) {
      setError('Failed to unblock IP');
    }
  };

  const handleUpdateThresholds = async () => {
    try {
      await fetch('/api/dashboard/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds)
      });
      setError(null);
    } catch (err) {
      setError('Failed to update thresholds');
    }
  };

  const renderStatsTab = () => (
    <Grid container spacing={3}>
      {Object.entries(stats || {}).map(([period, periodStats]) => (
        <Grid item xs={12} md={4} key={period}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {period.charAt(0).toUpperCase() + period.slice(1)} Statistics
              </Typography>
              {Object.entries(periodStats).map(([type, count]) => (
                <Typography key={type} variant="body2">
                  {type}: {count}
                </Typography>
              ))}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderBlockedIPsTab = () => {
    if (!userPermissions?.manageIPs) {
      return (
        <Alert severity="info">
          You don't have permission to manage IPs.
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>IP Address</TableCell>
              <TableCell>Blocked Until</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats?.blockedIPs?.map((ip) => (
              <TableRow key={ip.ip}>
                <TableCell>{ip.ip}</TableCell>
                <TableCell>{new Date(ip.blockedUntil).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleUnblockIP(ip.ip)}
                  >
                    Unblock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderIPStatsTab = () => (
    <Box>
      <TextField
        label="Enter IP Address"
        value={selectedIP}
        onChange={(e) => setSelectedIP(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={() => fetchIpStats(selectedIP)}
        disabled={!selectedIP}
      >
        Get Stats
      </Button>
      {ipStats && (
        <Box mt={3}>
          <Typography variant="h6">IP Statistics</Typography>
          <Typography>Total Violations: {ipStats.totalViolations}</Typography>
          <Typography>Currently Blocked: {ipStats.isBlocked ? 'Yes' : 'No'}</Typography>
          {/* Add more detailed stats display here */}
        </Box>
      )}
    </Box>
  );

  const renderThresholdsTab = () => {
    if (!userPermissions?.updateThresholds) {
      return (
        <Alert severity="info">
          You don't have permission to update thresholds.
        </Alert>
      );
    }

    return (
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Hourly Threshold"
              type="number"
              value={thresholds.hourly}
              onChange={(e) => setThresholds({ ...thresholds, hourly: parseInt(e.target.value) })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Daily Threshold"
              type="number"
              value={thresholds.daily}
              onChange={(e) => setThresholds({ ...thresholds, daily: parseInt(e.target.value) })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Weekly Threshold"
              type="number"
              value={thresholds.weekly}
              onChange={(e) => setThresholds({ ...thresholds, weekly: parseInt(e.target.value) })}
              fullWidth
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdateThresholds}
          sx={{ mt: 2 }}
        >
          Update Thresholds
        </Button>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Rate Limit Dashboard
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Statistics" />
          <Tab label="Blocked IPs" />
          <Tab label="IP Statistics" />
          <Tab label="Thresholds" />
        </Tabs>

        <Box p={3}>
          {activeTab === 0 && renderStatsTab()}
          {activeTab === 1 && renderBlockedIPsTab()}
          {activeTab === 2 && renderIPStatsTab()}
          {activeTab === 3 && renderThresholdsTab()}
        </Box>
      </Paper>
    </Container>
  );
};

export default Dashboard; 