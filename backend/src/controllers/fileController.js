const File = require('../models/File');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Upload a file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { originalname, mimetype, size, filename } = req.file;

    // Validate file type
    if (!ALLOWED_FILE_TYPES[mimetype]) {
      await unlinkAsync(req.file.path);
      return res.status(400).json({ message: 'File type not allowed' });
    }

    // Validate file size
    if (size > MAX_FILE_SIZE) {
      await unlinkAsync(req.file.path);
      return res.status(400).json({ message: 'File size exceeds limit' });
    }

    const file = new File({
      filename,
      originalName: originalname,
      mimeType: mimetype,
      size,
      path: req.file.path,
      uploadedBy: req.user._id,
      thread: req.body.threadId,
      post: req.body.postId
    });

    await file.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
};

// Get file by ID
exports.getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access to the file
    if (!file.isPublic && file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.sendFile(path.resolve(file.path));
  } catch (error) {
    console.error('File retrieval error:', error);
    res.status(500).json({ message: 'Error retrieving file' });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has permission to delete
    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from storage
    await unlinkAsync(file.path);

    // Delete file record from database
    await file.remove();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
};

// Get files by thread or post
exports.getFiles = async (req, res) => {
  try {
    const query = {};
    
    if (req.query.threadId) {
      query.thread = req.query.threadId;
    }
    if (req.query.postId) {
      query.post = req.query.postId;
    }
    if (req.query.userId) {
      query.uploadedBy = req.query.userId;
    }

    const files = await File.find(query)
      .sort({ createdAt: -1 })
      .select('filename originalName mimeType size createdAt');

    res.json(files);
  } catch (error) {
    console.error('Files retrieval error:', error);
    res.status(500).json({ message: 'Error retrieving files' });
  }
}; 