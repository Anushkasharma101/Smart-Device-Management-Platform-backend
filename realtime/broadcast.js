// realtime/broadcast.js

let ioInstance = null;

/**
 * Initialize the socket.io instance.
 * Call this once in your main server file after creating the io server.
 * @param {Server} io - socket.io server instance
 */
function initIO(io) {
  ioInstance = io;
}

/**
 * Broadcast device heartbeat event to clients in the organization's room.
 * @param {Object} heartbeatData - Contains device info and organizationId
 *   Example: { deviceId: 'xyz', organizationId: 'org123', status: 'online', timestamp: Date }
 */
function broadcastDeviceHeartbeat(heartbeatData) {
  if (!ioInstance) {
    console.error('Socket.io instance not initialized.');
    return;
  }

  const { organizationId } = heartbeatData;

  // Emit event only to clients connected to the organization's room
  ioInstance.to(organizationId).emit('deviceHeartbeat', heartbeatData);
}

module.exports = {
  initIO,
  broadcastDeviceHeartbeat,
};
