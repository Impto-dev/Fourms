import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, IconButton, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const FileDisplay = ({ files, onDelete, canDelete = true }) => {
  const { enqueueSnackbar } = useSnackbar();

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <ImageIcon />;
    if (mimeType === 'application/pdf') return <PictureAsPdfIcon />;
    return <DescriptionIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (file) => {
    try {
      const response = await axios.get(`/api/files/${file._id}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      enqueueSnackbar('Error downloading file', { variant: 'error' });
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`/api/files/${fileId}`);
      if (onDelete) {
        onDelete(fileId);
      }
      enqueueSnackbar('File deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Delete error:', error);
      enqueueSnackbar('Error deleting file', { variant: 'error' });
    }
  };

  if (!files || files.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No files attached
      </Typography>
    );
  }

  return (
    <List>
      {files.map((file) => (
        <ListItem
          key={file._id}
          secondaryAction={
            canDelete && (
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDelete(file._id)}
              >
                <DeleteIcon />
              </IconButton>
            )
          }
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getFileIcon(file.mimeType)}
                <Typography
                  variant="body1"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleDownload(file)}
                >
                  {file.originalName}
                </Typography>
              </Box>
            }
            secondary={
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label={formatFileSize(file.size)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={new Date(file.createdAt).toLocaleDateString()}
                  size="small"
                  variant="outlined"
                />
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default FileDisplay; 