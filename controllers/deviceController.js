const Device = require('../models/Device');
const Joi = require('joi');

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

    return res.status(201).json({ success: true, device });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.listDevices = async (req, res) => {
  try {
    const filter = { owner_id: req.user.id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const devices = await Device.find(filter);
    return res.json({ success: true, devices });
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

    return res.json({ success: true, message: 'Device heartbeat recorded', last_active_at: device.last_active_at.toISOString() });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
