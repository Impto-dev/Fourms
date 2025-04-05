import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
    Pagination,
    Container,
    Paper,
    Avatar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Reply as ReplyIcon,
    ThumbUp as ThumbUpIcon,
    ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { Editor } from '@tinymce/tinymce-react';
import { fetchThread, fetchPosts, createPost, updatePost, deletePost } from '../../store/slices/threadSlice';
import { checkPermissions } from '../../utils/auth';

const schema = yup.object().shape({
    content: yup.string()
        .required('Content is required')
        .min(10, 'Content must be at least 10 characters')
});

const ThreadDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { thread, posts, loading, error } = useSelector((state) => state.thread);
    const [hasPermission, setHasPermission] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [content, setContent] = useState('');
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
        if (id) {
            dispatch(fetchThread(id));
            dispatch(fetchPosts(id));
        }
    }, [dispatch, id]);

    const handleReply = async (data) => {
        try {
            await axios.post(`/api/threads/${id}/posts`, {
                content: replyContent
            });
            setReplyContent('');
            setShowReplyForm(false);
            dispatch(fetchPosts(id));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post reply');
        }
    };

    const handleEdit = async () => {
        try {
            await axios.put(`/api/threads/${id}`, {
                content: editContent
            });
            setIsEditing(false);
            dispatch(fetchThread(id));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update thread');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/api/threads/${id}`);
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