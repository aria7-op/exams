require('express-async-errors');
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path'); // Added for static file serving

const database = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');
const { auth } = require('./middleware/auth');
const AdvancedNotificationService = require('./services/advancedNotificationService');
const NotificationSchedulerService = require('./services/notificationSchedulerService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const examCategoryRoutes = require('./routes/examCategories');
const questionRoutes = require('./routes/questions');
const examRoutes = require('./routes/exams');
const bookingRoutes = require('./routes/bookings');
const attemptRoutes = require('./routes/attempts');
const paymentRoutes = require('./routes/payments');
const billingRoutes = require('./routes/billing');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL] 
      : ['http://localhost:3000', 'http://localhost:5173', 'http://192.168.0.7:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://192.168.0.7:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down requests
const speedLimiter = slowDown({
  windowMs: parseInt(process.env.SLOW_DOWN_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER) || 500, // allow 500 requests per 15 minutes, then... (increased for development)
  delayMs: () => parseInt(process.env.SLOW_DOWN_DELAY_MS) || 500, // begin adding 500ms of delay per request above 500
});

app.use(limiter);
app.use(speedLimiter);

// Compression
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging middleware
app.use(morgan('combined', { stream: logger.stream }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

// WebSocket event handlers
io.on('connection', (socket) => {
  logger.info(`🔌 WebSocket connected: ${socket.id}`);

  // Join admin room for real-time updates
  socket.on('join-admin', (data) => {
    socket.join('admin-room');
    logger.info(`👤 Admin joined: ${data.userId}`);
  });

  // Join user room for personal updates
  socket.on('join-user', (data) => {
    socket.join(`user-${data.userId}`);
    logger.info(`👤 User joined: ${data.userId}`);
  });

  // Handle exam attempts
  socket.on('exam-attempt-started', (data) => {
    socket.to('admin-room').emit('exam-attempt-started', data);
  });

  socket.on('exam-attempt-completed', (data) => {
    socket.to('admin-room').emit('exam-attempt-completed', data);
    socket.to(`user-${data.userId}`).emit('exam-result-ready', data);
  });

  // Handle new bookings
  socket.on('booking-created', (data) => {
    socket.to('admin-room').emit('booking-created', data);
  });

  // Handle payments
  socket.on('payment-processed', (data) => {
    socket.to('admin-room').emit('payment-processed', data);
    socket.to(`user-${data.userId}`).emit('payment-confirmed', data);
  });

  // Handle user activity
  socket.on('user-login', (data) => {
    socket.to('admin-room').emit('user-login', data);
  });

  socket.on('user-logout', (data) => {
    socket.to('admin-room').emit('user-logout', data);
  });

  // Handle real-time notifications
  socket.on('send-notification', (data) => {
    socket.to(`user-${data.userId}`).emit('notification-received', data);
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 WebSocket disconnected: ${socket.id}`);
  });
});

// Initialize notification services
const notificationService = new AdvancedNotificationService();
const notificationScheduler = new NotificationSchedulerService();

notificationService.setSocketIO(io);

// Make services available globally
global.io = io;
global.notificationService = notificationService;
global.notificationScheduler = notificationScheduler;

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', auth, userRoutes);
app.use('/api/v1/exam-categories', examCategoryRoutes);
app.use('/api/v1/questions', auth, questionRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/bookings', auth, bookingRoutes);
app.use('/api/v1/attempts', auth, attemptRoutes);
app.use('/api/v1/payments', auth, paymentRoutes);
app.use('/api/v1/billing', auth, billingRoutes);
app.use('/api/v1/analytics', auth, analyticsRoutes);
app.use('/api/v1/admin', auth, adminRoutes);
app.use('/api/v1/notifications', auth, notificationRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  notificationScheduler.stop();
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  notificationScheduler.stop();
  await database.disconnect();
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await database.connect();
    
    // Start notification scheduler
    notificationScheduler.start();
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 Network access: http://192.168.0.7:${PORT}/health`);
      logger.info(`🔌 WebSocket: ws://localhost:${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/v1/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; 