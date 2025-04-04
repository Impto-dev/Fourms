import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import {
    Box,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';

const schema = yup.object().shape({
    title: yup.string()
        .required('Title is required')
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title must not exceed 200 characters'),
    category: yup.string()
        .required('Category is required'),
    content: yup.string()
        .required('Content is required')
        .min(10, 'Content must be at least 10 characters')
});

const ThreadCreate = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [content, setContent] = useState('');

    const { register, handleSubmit, formState: { errors }, setValue } = useForm({
        resolver: yupResolver(schema)
    });

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

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError('');
            await axios.post('/api/threads', {
                ...data,
                content
            });
            navigate('/threads');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create thread');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
                Create New Thread
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <TextField
                    fullWidth
                    label="Title"
                    variant="outlined"
                    margin="normal"
                    {...register('title')}
                    error={!!errors.title}
                    helperText={errors.title?.message}
                />

                <FormControl fullWidth margin="normal">
                    <InputLabel>Category</InputLabel>
                    <Select
                        label="Category"
                        {...register('category')}
                        error={!!errors.category}
                    >
                        {categories.map((category) => (
                            <MenuItem key={category._id} value={category._id}>
                                {category.name}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.category && (
                        <Typography color="error" variant="caption">
                            {errors.category.message}
                        </Typography>
                    )}
                </FormControl>

                <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                        Content
                    </Typography>
                    <Editor
                        apiKey="your-tinymce-api-key"
                        value={content}
                        onEditorChange={(newContent) => {
                            setContent(newContent);
                            setValue('content', newContent);
                        }}
                        init={{
                            height: 400,
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
                    {errors.content && (
                        <Typography color="error" variant="caption">
                            {errors.content.message}
                        </Typography>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Create Thread'}
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/threads')}
                    >
                        Cancel
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default ThreadCreate; 