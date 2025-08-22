const { redisClient } = require('../redisClient');
const Log = require('../models/Log'); // Your device log model

// Helper to parse range strings into milliseconds
function parseRangeToMilliseconds(range) {
  switch (range) {
    case '1h': return 3600000;
    case '24h': return 86400000;
    case '7d': return 7 * 86400000;
    default: return 86400000; // default 24 hours
  }
}

exports.getDeviceUsage = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const range = req.query.range || '24h';

    const cacheKey = `analytics:device:${deviceId}:range:${range}`;

    // Try Redis cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json({ success: true, data: JSON.parse(cachedData), cached: true });
    }

    // Cache miss - run aggregation
    const usageData = await Log.aggregate([
      {
        $match: {
          device_id: deviceId,
          createdAt: {
            $gte: new Date(Date.now() - parseRangeToMilliseconds(range))
          }
        }
      },
      {
        $group: {
          _id: null,
          totalUsage: { $sum: "$usage" },
          averageUsage: { $avg: "$usage" }
        }
      }
    ]);

    // Cache for 5 minutes (300 seconds)
    await redisClient.set(cacheKey, JSON.stringify(usageData), { EX: 300 });

    return res.json({ success: true, data: usageData, cached: false });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

