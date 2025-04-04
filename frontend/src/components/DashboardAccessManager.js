import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardAccessManager = () => {
  const [accessList, setAccessList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissions, setPermissions] = useState({
    view: true,
    manageIPs: false,
    updateThresholds: false,
    manageAccess: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkPermissions();
    fetchAccessList();
  }, []);

  const checkPermissions = async () => {
    try {
      // First check if user is admin
      const adminResponse = await fetch('/api/auth/me');
      const adminData = await adminResponse.json();
      
      if (!adminData.isAdmin) {
        navigate('/');
        return;
      }

      // Then check for manageAccess permission
      const permissionResponse = await fetch('/api/dashboard/access/me/permission?permission=manageAccess');
      const permissionData = await permissionResponse.json();
      
      if (!permissionData.hasPermission) {
        navigate('/');
        return;
      }
    } catch (err) {
      navigate('/');
    }
  };

  const fetchAccessList = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/access');
      const data = await response.json();
      setAccessList(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch access list');
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setPermissions(user.permissions);
    } else {
      setSelectedUser(null);
      setPermissions({
        view: true,
        manageIPs: false,
        updateThresholds: false,
        manageAccess: false
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleSavePermissions = async () => {
    try {
      if (selectedUser) {
        // Update existing permissions
        await fetch(`/api/dashboard/access/${selectedUser.user._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions })
        });
      } else {
        // Grant new access
        await fetch('/api/dashboard/access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions })
        });
      }
      fetchAccessList();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save permissions');
    }
  };

  const handleRevokeAccess = async (userId) => {
    try {
      await fetch(`/api/dashboard/access/${userId}`, {
        method: 'DELETE'
      });
      fetchAccessList();
    } catch (err) {
      setError('Failed to revoke access');
    }
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
        Dashboard Access Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={() => handleOpenDialog()}
        sx={{ mb: 2 }}
      >
        Grant Access
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Granted By</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accessList.map((access) => (
              <TableRow key={access._id}>
                <TableCell>
                  {access.user.username} ({access.user.email})
                </TableCell>
                <TableCell>{access.grantedBy.username}</TableCell>
                <TableCell>
                  {Object.entries(access.permissions)
                    .filter(([_, value]) => value)
                    .map(([key]) => key)
                    .join(', ')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleOpenDialog(access)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleRevokeAccess(access.user._id)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedUser ? 'Edit Permissions' : 'Grant Dashboard Access'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {Object.entries(permissions).map(([key, value]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={value}
                    onChange={(e) =>
                      setPermissions({ ...permissions, [key]: e.target.checked })
                    }
                  />
                }
                label={key.charAt(0).toUpperCase() + key.slice(1)}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSavePermissions} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DashboardAccessManager; 