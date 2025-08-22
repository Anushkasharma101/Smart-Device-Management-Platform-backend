const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleswares/authMiddleware'); // your JWT auth middleware

// Protect all user profile routes
router.use(authMiddleware);

router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);

module.exports = router;
