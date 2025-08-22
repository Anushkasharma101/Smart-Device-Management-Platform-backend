const { redisClient } = require('../redisClient');
const User = require('../models/User');

// Get user profile with caching
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `user:${userId}`;

    // Check cache
    const cachedUser = await redisClient.get(cacheKey);
    if (cachedUser) {
      return res.json({ success: true, user: JSON.parse(cachedUser), cached: true });
    }

    // Cache miss - fetch from DB
    const user = await User.findById(userId).select('-password').lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Cache user data for 30 minutes
    await redisClient.set(cacheKey, JSON.stringify(user), { EX: 1800 });

    res.json({ success: true, user, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update user profile and invalidate cache
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    Object.assign(user, updateData);
    await user.save();

    // Invalidate cache after update
    await redisClient.del(`user:${userId}`);

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
