import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Pagination,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Chip,
    IconButton,
    Tooltip,
    Container,
    Paper,
    CircularProgress,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Sort as SortIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { fetchThreads } from '../../store/slices/threadSlice';
import { checkPermissions } from '../../utils/auth';

const ThreadList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { threads, loading, error, totalPages } = useSelector((state) => state.thread);
    const [hasPermission, setHasPermission] = useState(false);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const checkAccess = async () => {
            const hasAccess = await checkPermissions(['user']);
            setHasPermission(hasAccess);
            if (!hasAccess) {
                navigate('/login');
            }
        };
        checkAccess();
    }, [checkPermissions, navigate]);

    useEffect(() => {
        dispatch(fetchThreads({ page, search: searchQuery }));
    }, [dispatch, page, searchQuery]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/categories');
            setCategories(response.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    const handleCreateThread = () => {
        navigate('/threads/create');
    };

    const handleThreadClick = (threadId) => {
        navigate(`/threads/${threadId}`);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Forum Threads
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateThread}
                >
                    Create Thread
                </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Search threads"
                            variant="outlined"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                label="Category"
                            >
                                <MenuItem value="">All Categories</MenuItem>
                                {categories.map((cat) => (
                                    <MenuItem key={cat._id} value={cat._id}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                            <InputLabel>Sort By</InputLabel>
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                label="Sort By"
                            >
                                <MenuItem value="createdAt">Date Created</MenuItem>
                                <MenuItem value="title">Title</MenuItem>
                                <MenuItem value="postCount">Post Count</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Tooltip title={sortOrder === 'desc' ? 'Sort Ascending' : 'Sort Descending'}>
                            <IconButton
                                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                            >
                                <SortIcon />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Box>

            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            {loading ? (
                <Typography>Loading threads...</Typography>
            ) : (
                <>
                    {threads.map((thread) => (
                        <Card
                            key={thread._id}
                            sx={{ mb: 2, cursor: 'pointer' }}
                            onClick={() => handleThreadClick(thread._id)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="h6" component="h2">
                                        {thread.title}
                                    </Typography>
                                    <Chip
                                        label={thread.category?.name || 'Uncategorized'}
                                        color="primary"
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    by {thread.author?.username} • {formatDistanceToNow(new Date(thread.createdAt))} ago
                                </Typography>
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    {thread.content.substring(0, 200)}...
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {thread.postCount} posts
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Last updated {formatDistanceToNow(new Date(thread.updatedAt))} ago
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    ))}

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(e, value) => setPage(value)}
                            color="primary"
                        />
                    </Box>
                </>
            )}
        </Box>
    );
};

export default ThreadList; 