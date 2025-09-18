require('express-async-errors');
require('dotenv').config();

console.log('🔍 Starting debug server...');
console.log('🔍 Environment:', process.env.NODE_ENV);
console.log('🔍 Port:', process.env.PORT || 5050);

const express = require('express');
console.log('✅ Express loaded');

const cors = require('cors');
console.log('✅ CORS loaded');

const helmet = require('helmet');
console.log('✅ Helmet loaded');

const compression = require('compression');
console.log('✅ Compression loaded');

const morgan = require('morgan');
console.log('✅ Morgan loaded');

const http = require('http');
console.log('✅ HTTP loaded');

const socketIo = require('socket.io');
console.log('✅ Socket.IO loaded');

const path = require('path');
console.log('✅ Path loaded');

console.log('🔍 Loading database...');
const database = require('./config/database');
console.log('✅ Database config loaded');

console.log('🔍 Loading logger...');
const logger = require('./config/logger');
console.log('✅ Logger loaded');

console.log('🔍 Loading middleware...');
const errorHandler = require('./middleware/errorHandler');
console.log('✅ Error handler loaded');

const notFoundHandler = require('./middleware/notFoundHandler');
console.log('✅ Not found handler loaded');

const { auth } = require('./middleware/auth');
console.log('✅ Auth middleware loaded');

console.log('🔍 Loading services...');
const AdvancedNotificationService = require('./services/advancedNotificationService');
console.log('✅ AdvancedNotificationService loaded');

const NotificationSchedulerService = require('./services/notificationSchedulerService');
console.log('✅ NotificationSchedulerService loaded');

console.log('🔍 Loading routes...');
const authRoutes = require('./routes/auth');
console.log('✅ Auth routes loaded');

const userRoutes = require('./routes/users');
console.log('✅ User routes loaded');

const examCategoryRoutes = require('./routes/examCategories');
console.log('✅ Exam category routes loaded');

const questionRoutes = require('./routes/questions');
console.log('✅ Question routes loaded');

const examRoutes = require('./routes/exams');
console.log('✅ Exam routes loaded');

const bookingRoutes = require('./routes/bookings');
console.log('✅ Booking routes loaded');

const attemptRoutes = require('./routes/attempts');
console.log('✅ Attempt routes loaded');

const paymentRoutes = require('./routes/payments');
console.log('✅ Payment routes loaded');

const billingRoutes = require('./routes/billing');
console.log('✅ Billing routes loaded');

const analyticsRoutes = require('./routes/analytics');
console.log('✅ Analytics routes loaded');

const adminRoutes = require('./routes/admin');
console.log('✅ Admin routes loaded');

const notificationRoutes = require('./routes/notifications');
console.log('✅ Notification routes loaded');

console.log('🔍 Creating Express app...');
const app = express();
console.log('✅ Express app created');

console.log('🔍 Creating HTTP server...');
const server = http.createServer(app);
console.log('✅ HTTP server created');

const PORT = process.env.PORT || 5050;

console.log('🔍 Setting up basic middleware...');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('🔍 Adding health check...');
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

console.log('🔍 Testing database connection...');
async function testDatabase() {
  try {
    console.log('🔍 Attempting database connection...');
    await database.connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('❌ Full error:', error);
    return false;
  }
}

console.log('🔍 Starting server...');
async function startServer() {
  try {
    console.log('🔍 Testing database connection...');
    const dbConnected = await testDatabase();
    
    if (!dbConnected) {
      console.log('⚠️ Database connection failed, but continuing with server start...');
    }
    
    console.log('🔍 Starting HTTP server...');
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Debug server is running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
