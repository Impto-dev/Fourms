import React, { useState, useRef } from 'react';
import { Box, Button, Typography, List, ListItem, ListItemText, IconButton, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const FileUpload = ({ threadId, postId, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      enqueueSnackbar('Please select files to upload', { variant: 'warning' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('file', file);
    });
    if (threadId) formData.append('threadId', threadId);
    if (postId) formData.append('postId', postId);

    try {
      const response = await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      enqueueSnackbar('Files uploaded successfully', { variant: 'success' });
      setFiles([]);
      if (onUploadComplete) {
        onUploadComplete(response.data.files);
      }
    } catch (error) {
      console.error('Upload error:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Error uploading files',
        { variant: 'error' }
      );
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ width: '100%' }}>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
        ref={fileInputRef}
      />
      
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
        >
          Select Files
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
        >
          {uploading ? <CircularProgress size={24} /> : 'Upload Files'}
        </Button>
      </Box>

      {files.length > 0 && (
        <List>
          {files.map((file, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploading}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={file.name}
                secondary={`${formatFileSize(file.size)}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Typography variant="caption" color="text.secondary">
        Maximum file size: 10MB. Allowed file types: Images (JPG, PNG, GIF), PDF, Documents (DOC, DOCX), Spreadsheets (XLS, XLSX), Text files (TXT)
      </Typography>
    </Box>
  );
};

export default FileUpload; 