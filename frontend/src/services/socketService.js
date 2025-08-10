import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(token, userId, userRole) {
    if (this.socket && this.isConnected) {
      return;
    }

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Join appropriate rooms based on user role
      if (['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(userRole)) {
        this.socket.emit('join-admin', { userId, userRole });
      } else {
        this.socket.emit('join-user', { userId });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        toast.error('WebSocket connection failed. Real-time updates disabled.');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔌 WebSocket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      toast.success('Real-time connection restored');
    });

    // Real-time event handlers
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Admin events
    this.socket.on('exam-attempt-started', (data) => {
      console.log('📝 Exam attempt started:', data);
      toast.success(`New exam attempt started by ${data.userName}`);
    });

    this.socket.on('exam-attempt-completed', (data) => {
      console.log('✅ Exam attempt completed:', data);
      toast.success(`Exam completed by ${data.userName}`);
    });

    this.socket.on('booking-created', (data) => {
      console.log('📅 New booking created:', data);
      toast.success(`New booking created by ${data.userName}`);
    });

    this.socket.on('payment-processed', (data) => {
      console.log('💰 Payment processed:', data);
      toast.success(`Payment processed: $${data.amount}`);
    });

    this.socket.on('user-login', (data) => {
      console.log('👤 User logged in:', data);
      toast.success(`${data.userName} logged in`);
    });

    this.socket.on('user-logout', (data) => {
      console.log('👤 User logged out:', data);
      toast.info(`${data.userName} logged out`);
    });

    // User events
    this.socket.on('exam-result-ready', (data) => {
      console.log('📊 Exam result ready:', data);
      toast.success('Your exam result is ready!');
    });

    this.socket.on('payment-confirmed', (data) => {
      console.log('✅ Payment confirmed:', data);
      toast.success('Payment confirmed successfully!');
    });

    this.socket.on('notification-received', (data) => {
      console.log('🔔 Notification received:', data);
      toast(data.message, {
        icon: data.type === 'success' ? '✅' : data.type === 'error' ? '❌' : 'ℹ️',
        duration: 5000,
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Emit events
  emitExamAttemptStarted(data) {
    if (this.isConnected) {
      this.socket.emit('exam-attempt-started', data);
    }
  }

  emitExamAttemptCompleted(data) {
    if (this.isConnected) {
      this.socket.emit('exam-attempt-completed', data);
    }
  }

  emitBookingCreated(data) {
    if (this.isConnected) {
      this.socket.emit('booking-created', data);
    }
  }

  emitPaymentProcessed(data) {
    if (this.isConnected) {
      this.socket.emit('payment-processed', data);
    }
  }

  emitUserLogin(data) {
    if (this.isConnected) {
      this.socket.emit('user-login', data);
    }
  }

  emitUserLogout(data) {
    if (this.isConnected) {
      this.socket.emit('user-logout', data);
    }
  }

  sendNotification(userId, message, type = 'info') {
    if (this.isConnected) {
      this.socket.emit('send-notification', {
        userId,
        message,
        type,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Listen to events
  onExamAttemptStarted(callback) {
    if (this.socket) {
      this.socket.on('exam-attempt-started', callback);
    }
  }

  onExamAttemptCompleted(callback) {
    if (this.socket) {
      this.socket.on('exam-attempt-completed', callback);
    }
  }

  onBookingCreated(callback) {
    if (this.socket) {
      this.socket.on('booking-created', callback);
    }
  }

  onPaymentProcessed(callback) {
    if (this.socket) {
      this.socket.on('payment-processed', callback);
    }
  }

  onUserLogin(callback) {
    if (this.socket) {
      this.socket.on('user-login', callback);
    }
  }

  onUserLogout(callback) {
    if (this.socket) {
      this.socket.on('user-logout', callback);
    }
  }

  onNotificationReceived(callback) {
    if (this.socket) {
      this.socket.on('notification-received', callback);
    }
  }

  // Remove event listeners
  offExamAttemptStarted(callback) {
    if (this.socket) {
      this.socket.off('exam-attempt-started', callback);
    }
  }

  offExamAttemptCompleted(callback) {
    if (this.socket) {
      this.socket.off('exam-attempt-completed', callback);
    }
  }

  offBookingCreated(callback) {
    if (this.socket) {
      this.socket.off('booking-created', callback);
    }
  }

  offPaymentProcessed(callback) {
    if (this.socket) {
      this.socket.off('payment-processed', callback);
    }
  }

  offUserLogin(callback) {
    if (this.socket) {
      this.socket.off('user-login', callback);
    }
  }

  offUserLogout(callback) {
    if (this.socket) {
      this.socket.off('user-logout', callback);
    }
  }

  offNotificationReceived(callback) {
    if (this.socket) {
      this.socket.off('notification-received', callback);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService; 