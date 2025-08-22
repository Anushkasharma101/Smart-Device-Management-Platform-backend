const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { redisClient } = require('../redisClient');
const crypto = require('crypto');

const signupSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('user', 'admin').default('user'),
  organizationId: Joi.string().required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper token utils
function generateAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role, organizationId: user.organizationId }, JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Signup with optional token issuance
exports.signup = async (req, res) => {
  try {
    const { error, value } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { name, email, password, role, organizationId } = value;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ success: false, message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    user = new User({ name, email, password: hashedPassword, role, organizationId });
    await user.save();

    // Issue tokens immediately (optional)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(refreshToken);

    await redisClient.set(hashedRefreshToken, JSON.stringify({ userId: user._id }), { EX: 7 * 24 * 3600 });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role,organizationId: user.organizationId }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Login with token issuance
exports.login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { email, password } = value;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid email or password' });

    const accessToken = generateAccessToken(user);
    console.log('User passed to generateAccessToken:', user);

    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(refreshToken);

    await redisClient.set(hashedRefreshToken, JSON.stringify({ userId: user._id }), { EX: 7 * 24 * 3600 });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Refresh tokens with rotation
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const hashedToken = hashToken(refreshToken);
    const dataString = await redisClient.get(hashedToken);
    if (!dataString) return res.status(403).json({ success: false, message: 'Invalid or revoked refresh token' });

    const { userId } = JSON.parse(dataString);
    await redisClient.del(hashedToken);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken();
    const newHashedRefreshToken = hashToken(newRefreshToken);

    await redisClient.set(newHashedRefreshToken, JSON.stringify({ userId }), { EX: 7 * 24 * 3600 });

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(400).json({ message: "No token provided" });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(400).json({ message: "No token provided" });

    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return res.status(400).json({ message: "Invalid token" });

    const ttl = decoded.exp * 1000 - Date.now(); // milliseconds until expiry

    if (ttl <= 0) return res.status(400).json({ message: "Token already expired" });

    // Add token to Redis blacklist with TTL in seconds
    await redisClient.set(token, 'revoked', { PX: ttl });

    res.json({ message: "Logged out successfully, token revoked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};