const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URI,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries >= 10) {
        return new Error('Retry limit reached');
      }
      return Math.min(retries * 50, 2000);
    }
  }
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function connectRedis() {
  if (!redisClient.isOpen) await redisClient.connect();
  console.log('Redis connected');
}

module.exports = { redisClient, connectRedis };
