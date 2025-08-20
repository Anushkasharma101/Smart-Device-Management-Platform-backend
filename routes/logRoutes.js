const express = require('express');
const router = express.Router({ mergeParams: true });
const { createLog, getLogs, getUsage } = require('../controllers/logController');
const authMiddleware = require('../middleswares/authMiddleware');
const rateLimiter = require('../middleswares/rateLimiter');

router.use(authMiddleware, rateLimiter);

router.post('/:id/logs', createLog);
router.get('/:id/logs', getLogs);
router.get('/:id/usage', getUsage);

module.exports = router;
