const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { verifyToken } = require('../middleware/auth');

// Search routes
router.get('/', verifyToken, searchController.search);
router.get('/suggestions', verifyToken, searchController.getSuggestions);

module.exports = router; 