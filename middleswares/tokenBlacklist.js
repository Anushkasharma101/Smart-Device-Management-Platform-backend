const { redisClient } = require('../redisClient');

async function checkTokenBlacklist(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });

  const blacklisted = await redisClient.get(token);
  if (blacklisted) return res.status(401).json({ message: 'Token revoked' });

  next();
}

module.exports = checkTokenBlacklist;
