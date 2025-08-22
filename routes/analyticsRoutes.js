const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleswares/authMiddleware');

// Protect routes with auth middleware if needed
router.get('/devices/:id/usage', authMiddleware, analyticsController.getDeviceUsage);

module.exports = router;
