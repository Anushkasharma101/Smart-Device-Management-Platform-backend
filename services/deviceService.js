const Device = require('../models/Device');

exports.findUserDevices = async (userId, filters = {}) => {
  return Device.find({ owner_id: userId, ...filters });
};

exports.findOneUserDevice = async (deviceId, userId) => {
  return Device.findOne({ _id: deviceId, owner_id: userId });
};

exports.createDevice = async (deviceData) => {
  const device = new Device(deviceData);
  return device.save();
};


