const express = require('express');
const router = express.Router();
const rankController = require('../controllers/rankController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Public routes
router.get('/', rankController.getAllRanks);
router.get('/user/:userId', rankController.getUserRank);

// Admin routes
router.post('/', auth, admin, rankController.createRank);
router.put('/:id', auth, admin, rankController.updateRank);
router.delete('/:id', auth, admin, rankController.deleteRank);
router.post('/user/:userId/points', auth, admin, rankController.addPoints);

module.exports = router; 