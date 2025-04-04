const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const fileController = require('../controllers/fileController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// File upload route
router.post('/upload', auth, upload.single('file'), fileController.uploadFile);

// Get file by ID
router.get('/:id', auth, fileController.getFile);

// Delete file
router.delete('/:id', auth, fileController.deleteFile);

// Get files by thread, post, or user
router.get('/', auth, fileController.getFiles);

module.exports = router; 