const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
