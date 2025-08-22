const express = require('express');
const router = express.Router();
const {
  registerDevice,
  listDevices,
  updateDevice,
  deleteDevice,
  heartbeat,
  postDeviceHeartbeat
} = require('../controllers/deviceController');
const authMiddleware = require('../middleswares/authMiddleware');
const rateLimiter = require('../middleswares/rateLimiter');

router.use(authMiddleware, rateLimiter);

router.post('/', registerDevice);
router.get('/', listDevices);
router.patch('/:id', updateDevice);
router.delete('/:id', deleteDevice);
router.post('/:id/heartbeat', heartbeat);
router.post('/:id/heartbeat', postDeviceHeartbeat);


module.exports = router;
