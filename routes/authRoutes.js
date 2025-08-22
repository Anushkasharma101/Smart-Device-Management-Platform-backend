const express = require('express');
const router = express.Router();
const { signup, login, refreshToken, logout } = require('../controllers/authController');
const authMiddleware = require('../middleswares/authMiddleware'); 


router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authMiddleware, logout);

 

module.exports = router;
