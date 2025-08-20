const Log = require('../models/Log');
const Device = require('../models/Device');

exports.createLog = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const ownerId = req.user.id;

    const device = await Device.findOne({ _id: deviceId, owner_id: ownerId });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    const { event, value } = req.body;
    if (!event || typeof value !== 'number') {
      return res.status(400).json({ success: false, message: 'Invalid log data' });
    }

    const log = new Log({ device_id: deviceId, event, value });
    await log.save();

    return res.status(201).json({ success: true, log });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const ownerId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const device = await Device.findOne({ _id: deviceId, owner_id: ownerId });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    const logs = await Log.find({ device_id: deviceId }).sort({ timestamp: -1 }).limit(limit);

    return res.json({ success: true, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUsage = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const ownerId = req.user.id;
    const range = req.query.range || '24h';

    const device = await Device.findOne({ _id: deviceId, owner_id: ownerId });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });

    let timeLimit = new Date();
    if (range === '24h') {
      timeLimit.setHours(timeLimit.getHours() - 24);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid range parameter' });
    }

    const logs = await Log.find({
      device_id: deviceId,
      event: 'units_consumed',
      timestamp: { $gte: timeLimit }
    });

    const totalUnits = logs.reduce((sum, log) => sum + log.value, 0);

    return res.json({ success: true, device_id: deviceId, total_units_last_24h: totalUnits });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
