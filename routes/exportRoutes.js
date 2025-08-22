const express = require('express');
const router = express.Router();
const { createExportJob, getExportJobStatus } = require('../controllers/exportController');
const authMiddleware = require('../middleswares/authMiddleware');

router.post('/api/export', authMiddleware,createExportJob);
router.get('/api/export/:jobId', authMiddleware, getExportJobStatus);


module.exports = router;
