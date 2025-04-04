import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Avatar,
    Tabs,
    Tab,
    Grid,
    CircularProgress,
    Alert,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    CalendarToday as CalendarIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const schema = yup.object().shape({
    username: yup.string()
        .required('Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must not exceed 20 characters'),
    email: yup.string()
        .email('Invalid email')
        .required('Email is required'),
    bio: yup.string()
        .max(500, 'Bio must not exceed 500 characters')
});

const UserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [threads, setThreads] = useState([]);
    const [posts, setPosts] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema)
    });

    useEffect(() => {
        fetchUser();
        if (activeTab === 0) {
            fetchThreads();
        } else {
            fetchPosts();
        }
    }, [userId, activeTab]);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/users/${userId}`);
            setUser(response.data);
            reset({
                username: response.data.username,
                email: response.data.email,
                bio: response.data.bio || ''
            });
            setError('');
        } catch (err) {
            setError('Failed to fetch user');
            console.error('Error fetching user:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchThreads = async () => {
        try {
            const response = await axios.get(`/api/users/${userId}/threads`);
            setThreads(response.data);
        } catch (err) {
            console.error('Error fetching threads:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            const response = await axios.get(`/api/users/${userId}/posts`);
            setPosts(response.data);
        } catch (err) {
            console.error('Error fetching posts:', err);
        }
    };

    const handleProfileSubmit = async (data) => {
        try {
            await axios.put(`/api/users/${userId}`, data);
            setIsEditing(false);
            fetchUser();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDeleteAccount = async () => {
        try {
            await axios.delete(`/api/users/${userId}`);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete account');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return (
            <Alert severity="error" sx={{ m: 3 }}>
                User not found
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                sx={{ width: 100, height: 100, mr: 3 }}
                                src={user.avatar}
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                                {isEditing ? (
                                    <form onSubmit={handleSubmit(handleProfileSubmit)}>
                                        <TextField
                                            fullWidth
                                            label="Username"
                                            {...register('username')}
                                            error={!!errors.username}
                                            helperText={errors.username?.message}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            {...register('email')}
                                            error={!!errors.email}
                                            helperText={errors.email?.message}
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Bio"
                                            multiline
                                            rows={4}
                                            {...register('bio')}
                                            error={!!errors.bio}
                                            helperText={errors.bio?.message}
                                            sx={{ mb: 2 }}
                                        />
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                            >
                                                Save Changes
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={() => setIsEditing(false)}
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </form>
                                ) : (
                                    <>
                                        <Typography variant="h4" component="h1">
                                            {user.username}
                                        </Typography>
                                        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                                            {user.bio || 'No bio yet'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                {user.email}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                                Joined {formatDistanceToNow(new Date(user.createdAt))} ago
                                            </Typography>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        </Box>
                        {user.isCurrentUser && (
                            <>
                                <IconButton onClick={handleMenuClick}>
                                    <MoreVertIcon />
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem onClick={() => {
                                        setIsEditing(true);
                                        handleMenuClose();
                                    }}>
                                        <EditIcon sx={{ mr: 1 }} /> Edit Profile
                                    </MenuItem>
                                    <MenuItem onClick={() => {
                                        handleDeleteAccount();
                                        handleMenuClose();
                                    }}>
                                        <DeleteIcon sx={{ mr: 1 }} /> Delete Account
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>
                </CardContent>
            </Card>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Threads" />
                    <Tab label="Posts" />
                </Tabs>
            </Box>

            {activeTab === 0 ? (
                <Grid container spacing={3}>
                    {threads.map((thread) => (
                        <Grid item xs={12} key={thread._id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" component="h2">
                                        {thread.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {formatDistanceToNow(new Date(thread.createdAt))} ago
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 1 }}>
                                        {thread.content.substring(0, 200)}...
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Grid container spacing={3}>
                    {posts.map((post) => (
                        <Grid item xs={12} key={post._id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        In thread: {post.thread?.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        {formatDistanceToNow(new Date(post.createdAt))} ago
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 1 }}>
                                        {post.content.substring(0, 200)}...
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default UserProfile; 