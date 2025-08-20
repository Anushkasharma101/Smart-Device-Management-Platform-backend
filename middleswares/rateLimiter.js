const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100,
  keyGenerator: (req) => {
    if (req.user && req.user.id) {
      return req.user.id; 
    }
    
    return ipKeyGenerator(req);
  },
  handler: (req, res) => {
    res.status(429).json({ success: false, message: 'Too many requests, please try later.' });
  }
});

module.exports = limiter;
