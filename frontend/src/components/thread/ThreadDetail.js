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
    IconButton,
    Menu,
    MenuItem,
    Divider,
    CircularProgress,
    Alert,
    Pagination
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Reply as ReplyIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { Editor } from '@tinymce/tinymce-react';

const schema = yup.object().shape({
    content: yup.string()
        .required('Content is required')
        .min(10, 'Content must be at least 10 characters')
});

const ThreadDetail = () => {
    const { threadId } = useParams();
    const navigate = useNavigate();
    const [thread, setThread] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [replyContent, setReplyContent] = useState('');
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(schema)
    });

    useEffect(() => {
        fetchThread();
        fetchPosts();
    }, [threadId, page]);

    const fetchThread = async () => {
        try {
            const response = await axios.get(`/api/threads/${threadId}`);
            setThread(response.data);
        } catch (err) {
            setError('Failed to fetch thread');
            console.error('Error fetching thread:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            const response = await axios.get(`/api/threads/${threadId}/posts`, {
                params: { page }
            });
            setPosts(response.data.posts);
            setTotalPages(response.data.totalPages);
        } catch (err) {
            setError('Failed to fetch posts');
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (data) => {
        try {
            await axios.post(`/api/threads/${threadId}/posts`, {
                content: replyContent
            });
            setReplyContent('');
            setShowReplyForm(false);
            fetchPosts();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post reply');
        }
    };

    const handleEdit = async () => {
        try {
            await axios.put(`/api/threads/${threadId}`, {
                content: editContent
            });
            setIsEditing(false);
            fetchThread();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update thread');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/api/threads/${threadId}`);
            navigate('/threads');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete thread');
        }
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!thread) {
        return (
            <Alert severity="error" sx={{ m: 3 }}>
                Thread not found
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
                        <Typography variant="h4" component="h1">
                            {thread.title}
                        </Typography>
                        {thread.isAuthor && (
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
                                        setEditContent(thread.content);
                                        handleMenuClose();
                                    }}>
                                        <EditIcon sx={{ mr: 1 }} /> Edit
                                    </MenuItem>
                                    <MenuItem onClick={() => {
                                        handleDelete();
                                        handleMenuClose();
                                    }}>
                                        <DeleteIcon sx={{ mr: 1 }} /> Delete
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        by {thread.author?.username} • {formatDistanceToNow(new Date(thread.createdAt))} ago
                    </Typography>

                    {isEditing ? (
                        <Box sx={{ mt: 2 }}>
                            <Editor
                                apiKey="your-tinymce-api-key"
                                value={editContent}
                                onEditorChange={setEditContent}
                                init={{
                                    height: 300,
                                    menubar: false,
                                    plugins: [
                                        'advlist autolink lists link image charmap print preview anchor',
                                        'searchreplace visualblocks code fullscreen',
                                        'insertdatetime media table paste code help wordcount'
                                    ],
                                    toolbar:
                                        'undo redo | formatselect | bold italic backcolor | \
                                        alignleft aligncenter alignright alignjustify | \
                                        bullist numlist outdent indent | removeformat | help'
                                }}
                            />
                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={handleEdit}
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
                        </Box>
                    ) : (
                        <Box
                            sx={{ mt: 2 }}
                            dangerouslySetInnerHTML={{ __html: thread.content }}
                        />
                    )}
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    Replies
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<ReplyIcon />}
                    onClick={() => setShowReplyForm(true)}
                >
                    Reply
                </Button>
            </Box>

            {showReplyForm && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <form onSubmit={handleSubmit(handleReply)}>
                            <Editor
                                apiKey="your-tinymce-api-key"
                                value={replyContent}
                                onEditorChange={setReplyContent}
                                init={{
                                    height: 200,
                                    menubar: false,
                                    plugins: [
                                        'advlist autolink lists link image charmap print preview anchor',
                                        'searchreplace visualblocks code fullscreen',
                                        'insertdatetime media table paste code help wordcount'
                                    ],
                                    toolbar:
                                        'undo redo | formatselect | bold italic backcolor | \
                                        alignleft aligncenter alignright alignjustify | \
                                        bullist numlist outdent indent | removeformat | help'
                                }}
                            />
                            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                >
                                    Post Reply
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setShowReplyForm(false)}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </form>
                    </CardContent>
                </Card>
            )}

            {posts.map((post) => (
                <Card key={post._id} sx={{ mb: 2 }}>
                    <CardContent>
                        <Typography variant="body2" color="text.secondary">
                            by {post.author?.username} • {formatDistanceToNow(new Date(post.createdAt))} ago
                        </Typography>
                        <Box
                            sx={{ mt: 1 }}
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
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
        </Box>
    );
};

export default ThreadDetail; 