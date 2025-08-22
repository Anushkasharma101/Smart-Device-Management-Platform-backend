const Device = require('../models/Device');
const Joi = require('joi');
const { redisClient } = require('../redisClient');
const { broadcastDeviceHeartbeat } = require('../realtime/broadcast');


const deviceSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().required(),
  status: Joi.string().valid('active', 'inactive').required()
});

exports.registerDevice = async (req, res) => {
  try {
    const { error, value } = deviceSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { name, type, status } = value;
    const owner_id = req.user.id;

    const device = new Device({ name, type, status, owner_id });
    await device.save();

    // Invalidate device listings cache for user
    await redisClient.del(`devices:${owner_id}:type=all:status=all`);

    return res.status(201).json({ success: true, device });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.listDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type || 'all';
    const status = req.query.status || 'all';

    // Generate cache key based on user and filters
    const cacheKey = `devices:${userId}:type=${type}:status=${status}`;

    // Try getting devices from Redis cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({ success: true, devices: JSON.parse(cached), cached: true });
    }

    // Cache miss - query DB
    const filter = { owner_id: userId };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const devices = await Device.find(filter).lean();

    // Cache the result with TTL 20 minutes (1200 seconds)
    await redisClient.set(cacheKey, JSON.stringify(devices), { EX: 1200 });

    return res.json({ success: true, devices, cached: false });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const id = req.params.id;
    const updateData = req.body;

    const device = await Device.findOne({ _id: id, owner_id: req.user.id });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    Object.assign(device, updateData);
    await device.save();

    // Invalidate cache after update
    await redisClient.del(`devices:${req.user.id}:type=all:status=all`);

    return res.json({ success: true, device });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const id = req.params.id;
    const device = await Device.findOneAndDelete({ _id: id, owner_id: req.user.id });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    // Invalidate cache after delete
    await redisClient.del(`devices:${req.user.id}:type=all:status=all`);

    return res.json({ success: true, message: 'Device deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.heartbeat = async (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;

    const device = await Device.findOne({ _id: id, owner_id: req.user.id });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    device.status = status;
    device.last_active_at = new Date();

    await device.save();

    // Optional: Invalidate cache if you want device listing up-to-date immediately
    await redisClient.del(`devices:${req.user.id}:type=all:status=all`);

    return res.json({ success: true, message: 'Device heartbeat recorded', last_active_at: device.last_active_at.toISOString() });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.postDeviceHeartbeat = async (req, res) => {
  try {
    const heartbeatData = {
      deviceId: req.params.id,                      // Use route param for device ID
      organizationId: req.user.organizationId,     // From authenticated user info
      status: req.body.status,
      timestamp: new Date(),
    };

    // TODO: Save or update heartbeat data in your DB if needed

    // Broadcast real-time update to clients via WebSocket
    broadcastDeviceHeartbeat(heartbeatData);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
