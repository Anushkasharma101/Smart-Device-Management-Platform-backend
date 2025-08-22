require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const responseTime = require('response-time');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { initIO } = require('./realtime/broadcast');


const connectDB = require('./db');
const { connectRedis, redisClient } = require('./redisClient');

const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const logRoutes = require('./routes/logRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');
const exportRoutes = require('./routes/exportRoutes');


const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};
app.use(cors(corsOptions));

// JSON body parsing
app.use(express.json());

// Response time logging middleware
app.use(responseTime((req, res, time) => {
  console.log(`${req.method} ${req.originalUrl} - ${time.toFixed(2)} ms`);
}));

// Request logging with IP tracking
app.use(morgan(':remote-addr :method :url :status :response-time ms'));

// Declare rate limiters but assign after Redis connection
let authLimiter;
let deviceLimiter;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    require('./queues/exportQueue');

    // Create rate limiters
    authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Too many auth requests, please try again later',
      store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      }),
    });

    deviceLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many device requests, please try again later',
      store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      }),
    });

    // Apply rate limiters and routes AFTER rate limiter creation
    app.use('/auth', authLimiter, authRoutes);
    app.use('/devices', deviceLimiter, deviceRoutes);
    app.use('/devices', logRoutes); // No rate limiting applied here
    app.use('/analytics', analyticsRoutes);
    app.use('/user', userRoutes);
    app.use('/devices', exportRoutes);


    // Global error handler
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    });

    // Create HTTP server and attach socket.io
    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      }
    });

    initIO(io);


    // JWT authentication for socket.io connections
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = user;
        next();
      } catch (err) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user.id}`);

      // Join room for organization-based broadcasting
      socket.join(socket.user.organizationId);

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user.id}`);
      });
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
