// services/deviceLogService.js

const Log = require('../models/Log'); // adjust filename/casing if needed

/**
 * Query device logs filtered by user/org and optional date range
 * @param {string} organizationId - org or user id who owns devices
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {Promise<Array>} Device log entries
 */
async function queryDeviceLogs(organizationId, startDate, endDate) {
  const filter = { organizationId };  // Assuming logs have organizationId field

  if (startDate) {
    filter.timestamp = { ...filter.timestamp, $gte: new Date(startDate) };
  }
  if (endDate) {
    filter.timestamp = { ...filter.timestamp, $lte: new Date(endDate) };
  }

  return await Log.find(filter).sort({ timestamp: -1 }).lean();
}

module.exports = {
  queryDeviceLogs,
};
