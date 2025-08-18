const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const EmailService = require('./emailService');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const emailService = new EmailService();

class AdvancedNotificationService {
  constructor() {
    this.isEnabled = process.env.NOTIFICATIONS_ENABLED !== 'false';
    this.channels = {
      websocket: true,
      email: false, // Disabled - no more email notifications
      push: process.env.PUSH_NOTIFICATIONS_ENABLED === 'true',
      sms: process.env.SMS_NOTIFICATIONS_ENABLED === 'true',
      database: true
    };
    this.io = null; // Will be set by server.js
  }

  /**
   * Set WebSocket instance
   */
  setSocketIO(io) {
    this.io = io;
    logger.info('🔔 NotificationService: WebSocket instance set');
  }

  /**
   * Core notification sending method - handles all delivery channels
   */
  async sendNotification(notificationData) {
    try {
      if (!this.isEnabled) {
        logger.info('Notifications disabled, skipping notification', { type: notificationData.type });
        return { success: true, message: 'Notification skipped (disabled)' };
      }

      const {
        userId,
        type,
        title,
        message,
        data = {},
        priority = 'normal', // low, normal, high, urgent
        channels = ['websocket', 'database'], // which channels to use (email removed)
        templateData = {},
        scheduleAt = null,
        expiresAt = null
      } = notificationData;

      // Generate unique notification ID
      const notificationId = uuidv4();
      
      logger.info('🔔 Sending notification', {
        notificationId,
        userId,
        type,
        title,
        priority,
        channels
      });

      const results = [];

      // Store in database if enabled
      if (channels.includes('database') && this.channels.database) {
        const dbResult = await this.storeNotification({
          id: notificationId,
          userId,
          type,
          title,
          message,
          data,
          priority,
          scheduleAt,
          expiresAt
        });
        results.push({ channel: 'database', success: dbResult.success });
      }

      // Send via WebSocket if enabled and user is online
      if (channels.includes('websocket') && this.channels.websocket && this.io) {
        const wsResult = await this.sendWebSocketNotification(userId, {
          id: notificationId,
          type,
          title,
          message,
          data,
          priority,
          timestamp: new Date().toISOString()
        });
        results.push({ channel: 'websocket', success: wsResult.success });
      }

      // Send email if enabled
      if (channels.includes('email') && this.channels.email) {
        const emailResult = await this.sendEmailNotification(userId, {
          type,
          title,
          message,
          templateData
        });
        results.push({ channel: 'email', success: emailResult.success });
      }

      // Send push notification if enabled
      if (channels.includes('push') && this.channels.push) {
        const pushResult = await this.sendPushNotification(userId, {
          title,
          message,
          data
        });
        results.push({ channel: 'push', success: pushResult.success });
      }

      // Send SMS if enabled
      if (channels.includes('sms') && this.channels.sms) {
        const smsResult = await this.sendSMSNotification(userId, {
          message: `${title}: ${message}`
        });
        results.push({ channel: 'sms', success: smsResult.success });
      }

      const successfulChannels = results.filter(r => r.success).length;
      const totalChannels = results.length;

      logger.info('📨 Notification sent', {
        notificationId,
        successfulChannels,
        totalChannels,
        results
      });

      return {
        success: successfulChannels > 0,
        notificationId,
        results,
        message: `Notification sent via ${successfulChannels}/${totalChannels} channels`
      };
    } catch (error) {
      logger.error('❌ Failed to send notification', error);
      return { success: false, message: 'Failed to send notification', error: error.message };
    }
  }

  /**
   * Store notification in database
   */
  async storeNotification(notificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          id: notificationData.id,
          userId: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          data: notificationData.data,
          priority: notificationData.priority,
          status: 'UNREAD',
          scheduleAt: notificationData.scheduleAt,
          expiresAt: notificationData.expiresAt
        }
      });
      
      return { success: true, notification };
    } catch (error) {
      logger.error('Failed to store notification', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WebSocket notification
   */
  async sendWebSocketNotification(userId, notificationData) {
    try {
      if (!this.io) {
        return { success: false, error: 'WebSocket not initialized' };
      }

      // Send to specific user room
      this.io.to(`user-${userId}`).emit('notification', notificationData);
      
      // Also send to admin room if it's an important notification
      if (['high', 'urgent'].includes(notificationData.priority)) {
        this.io.to('admin-room').emit('admin-notification', {
          ...notificationData,
          targetUserId: userId
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to send WebSocket notification', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(userId, notificationData) {
    try {
      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Send email based on notification type
      const emailResult = await this.sendTypedEmail(user.email, notificationData, user);
      return emailResult;
    } catch (error) {
      logger.error('Failed to send email notification', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send typed email based on notification type
   */
  async sendTypedEmail(email, notificationData, userData) {
    try {
      const { type, templateData } = notificationData;
      
      switch (type) {
        case 'BOOKING_CONFIRMED':
          await emailService.sendExamBookingConfirmation(email, templateData);
          break;
        case 'EXAM_COMPLETED':
          await emailService.sendExamResultsEmail(email, templateData);
          break;
        case 'CERTIFICATE_READY':
          await emailService.sendCertificateEmail(email, templateData);
          break;
        case 'ACCOUNT_STATUS_CHANGED':
          await emailService.sendAccountStatusEmail(email, templateData);
          break;
        default:
          // Generic notification email
          await emailService.sendNotificationEmail(email, {
            ...notificationData,
            userName: `${userData.firstName} ${userData.lastName}`
          });
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to send typed email', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification (placeholder for future implementation)
   */
  async sendPushNotification(userId, notificationData) {
    try {
      // Placeholder for push notification implementation
      // This would integrate with services like Firebase FCM, Apple Push, etc.
      logger.info('Push notification would be sent', { userId, notification: notificationData });
      return { success: true };
    } catch (error) {
      logger.error('Failed to send push notification', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification (placeholder for future implementation)
   */
  async sendSMSNotification(userId, notificationData) {
    try {
      // Placeholder for SMS implementation
      // This would integrate with services like Twilio, AWS SNS, etc.
      logger.info('SMS notification would be sent', { userId, notification: notificationData });
      return { success: true };
    } catch (error) {
      logger.error('Failed to send SMS notification', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // BUSINESS EVENT NOTIFICATION METHODS
  // ============================================================================

  /**
   * User Registration Notification
   */
  async notifyUserRegistered(userData) {
    return await this.sendNotification({
      userId: userData.id,
      type: 'USER_REGISTERED',
      title: '🎉 Welcome to Our Platform!',
      message: `Welcome ${userData.firstName}! Your account has been created successfully.`,
      priority: 'normal',
      channels: ['websocket', 'database'],
      templateData: userData
    });
  }

  /**
   * Email Verification Notification
   */
  async notifyEmailVerified(userData) {
    return await this.sendNotification({
      userId: userData.id,
      type: 'EMAIL_VERIFIED',
      title: '✅ Email Verified Successfully',
      message: 'Your email has been verified. You can now access all platform features.',
      priority: 'normal',
      channels: ['websocket', 'database']
    });
  }

  /**
   * Account Status Change Notification
   */
  async notifyAccountStatusChanged(userId, statusData) {
    const title = statusData.isActive ? '✅ Account Activated' : '⚠️ Account Deactivated';
    const message = statusData.isActive 
      ? 'Your account has been activated and you can now access the platform.'
      : `Your account has been deactivated. Reason: ${statusData.reason || 'Administrative decision'}`;
    
    return await this.sendNotification({
      userId,
      type: 'ACCOUNT_STATUS_CHANGED',
      title,
      message,
      priority: 'high',
      channels: ['websocket', 'database'],
      templateData: statusData
    });
  }

  /**
   * Exam Booking Confirmation - PERSONAL NOTIFICATION
   */
  async notifyBookingConfirmed(bookingData) {
    // Format the scheduled date for better display
    const scheduledDate = bookingData.scheduledAt ? new Date(bookingData.scheduledAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'TBD';

    return await this.sendPersonalNotification(bookingData.userId, {
      type: 'BOOKING_CONFIRMED',
      title: '📅 Exam Booking Confirmed',
      message: `Your booking for "${bookingData.exam.title}" has been confirmed${bookingData.scheduledAt ? ` and is scheduled for ${scheduledDate}` : ''}.`,
      priority: 'normal',
      data: { 
        bookingId: bookingData.id, 
        examId: bookingData.examId,
        examTitle: bookingData.exam.title,
        scheduledAt: bookingData.scheduledAt,
        totalAmount: bookingData.totalAmount,
        currency: bookingData.currency
      }
    });
  }

  /**
   * Booking Cancellation Notification - PERSONAL NOTIFICATION
   */
  async notifyBookingCancelled(bookingData, reason) {
    return await this.sendPersonalNotification(bookingData.userId, {
      type: 'BOOKING_CANCELLED',
      title: '❌ Exam Booking Cancelled',
      message: `Your booking for "${bookingData.exam.title}" has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      priority: 'normal',
      data: { 
        bookingId: bookingData.id, 
        examId: bookingData.examId, 
        reason,
        examTitle: bookingData.exam.title
      }
    });
  }

  /**
   * Payment Success Notification
   */
  async notifyPaymentSuccess(paymentData) {
    return await this.sendNotification({
      userId: paymentData.userId,
      type: 'PAYMENT_SUCCESS',
      title: '💳 Payment Successful',
      message: `Payment of ${paymentData.currency} ${paymentData.amount} has been processed successfully.`,
      priority: 'normal',
      channels: ['websocket', 'database'],
      data: { paymentId: paymentData.id, amount: paymentData.amount }
    });
  }

  /**
   * Payment Failed Notification
   */
  async notifyPaymentFailed(paymentData) {
    return await this.sendNotification({
      userId: paymentData.userId,
      type: 'PAYMENT_FAILED',
      title: '⚠️ Payment Failed',
      message: `Payment of ${paymentData.currency} ${paymentData.amount} could not be processed. Please try again.`,
      priority: 'high',
      channels: ['websocket', 'database'],
      data: { paymentId: paymentData.id, amount: paymentData.amount }
    });
  }

  /**
   * Exam Started Notification
   */
  async notifyExamStarted(attemptData) {
    return await this.sendNotification({
      userId: attemptData.userId,
      type: 'EXAM_STARTED',
      title: '📝 Exam Started',
      message: `You have started the exam "${attemptData.exam.title}". Good luck!`,
      priority: 'normal',
      channels: ['websocket', 'database'],
      data: { attemptId: attemptData.id, examId: attemptData.examId }
    });
  }

  /**
   * Exam Completed Notification
   */
  async notifyExamCompleted(attemptData, results) {
    const passed = results.percentage >= results.passingPercentage;
    const title = passed ? '🎉 Exam Completed - Passed!' : '📝 Exam Completed';
    const message = `You scored ${results.percentage.toFixed(1)}% on "${attemptData.exam.title}". ${passed ? 'Congratulations!' : 'Keep practicing!'}`;
    
    return await this.sendNotification({
      userId: attemptData.userId,
      type: 'EXAM_COMPLETED',
      title,
      message,
      priority: 'high',
      channels: ['websocket', 'database'],
      data: { 
        attemptId: attemptData.id, 
        examId: attemptData.examId,
        score: results.score,
        percentage: results.percentage,
        passed
      },
      templateData: { ...attemptData, ...results, passed }
    });
  }

  /**
   * Admin broadcast: Exam attempt started
   */
  async notifyAdminsExamAttemptStarted(attemptData) {
    try {
      // Persist notifications for admins and moderators
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'] }, isActive: true },
        select: { id: true }
      });

      const notifications = admins.map(admin => this.sendNotification({
        userId: admin.id,
        type: 'EXAM_ATTEMPT_STARTED',
        title: '📝 Exam Attempt Started',
        message: `User ${attemptData.userId} started exam "${attemptData.exam?.title || attemptData.examId}"`,
        priority: 'normal',
        channels: ['websocket', 'database'],
        data: { attemptId: attemptData.id, examId: attemptData.examId, userId: attemptData.userId }
      }));

      await Promise.all(notifications);

      // Realtime broadcast
      if (this.io) {
        this.io.to('admin-room').emit('exam-attempt-started', {
          userId: attemptData.userId,
          examId: attemptData.examId,
          attemptId: attemptData.id,
          examTitle: attemptData.exam?.title || 'Exam'
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to notify admins: exam attempt started', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin broadcast: Single answer submitted
   */
  async notifyAdminsExamAnswerSubmitted(payload) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'] }, isActive: true },
        select: { id: true }
      });

      const notifications = admins.map(admin => this.sendNotification({
        userId: admin.id,
        type: 'EXAM_ANSWER_SUBMITTED',
        title: '🧩 Answer Submitted',
        message: `User ${payload.userId} submitted an answer`,
        priority: 'low',
        channels: ['websocket', 'database'],
        data: payload
      }));

      await Promise.all(notifications);

      if (this.io) {
        this.io.to('admin-room').emit('exam-answer-submitted', payload);
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to notify admins: exam answer submitted', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin broadcast: Exam attempt completed
   */
  async notifyAdminsExamAttemptCompleted(attemptData, results) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'] }, isActive: true },
        select: { id: true }
      });

      const notifications = admins.map(admin => this.sendNotification({
        userId: admin.id,
        type: 'EXAM_ATTEMPT_COMPLETED',
        title: '✅ Exam Attempt Completed',
        message: `User ${attemptData.userId} completed exam "${attemptData.exam?.title || attemptData.examId}" with ${results?.percentage?.toFixed?.(1) ?? results?.percentage || 0}%`,
        priority: 'high',
        channels: ['websocket', 'database'],
        data: { attemptId: attemptData.id, examId: attemptData.examId, userId: attemptData.userId, percentage: results?.percentage }
      }));

      await Promise.all(notifications);

      if (this.io) {
        this.io.to('admin-room').emit('exam-attempt-completed', {
          userId: attemptData.userId,
          examId: attemptData.examId,
          attemptId: attemptData.id,
          percentage: results?.percentage
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to notify admins: exam attempt completed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin broadcast: Booking created
   */
  async notifyAdminsBookingCreated(booking) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'] }, isActive: true },
        select: { id: true }
      });

      const notifications = admins.map(admin => this.sendNotification({
        userId: admin.id,
        type: 'BOOKING_CREATED',
        title: '🆕 New Exam Booking',
        message: `Booking created for exam "${booking.exam?.title || booking.examId}"`,
        priority: 'normal',
        channels: ['websocket', 'database'],
        data: { bookingId: booking.id, examId: booking.examId, userId: booking.userId }
      }));

      await Promise.all(notifications);

      if (this.io) {
        this.io.to('admin-room').emit('booking-created', {
          bookingId: booking.id,
          examId: booking.examId,
          userId: booking.userId,
          scheduledAt: booking.scheduledAt
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to notify admins: booking created', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin broadcast: Payment processed
   */
  async notifyAdminsPaymentProcessed(payment) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'] }, isActive: true },
        select: { id: true }
      });

      const notifications = admins.map(admin => this.sendNotification({
        userId: admin.id,
        type: 'PAYMENT_PROCESSED',
        title: '💳 Payment Processed',
        message: `Payment processed for user ${payment.userId}`,
        priority: 'normal',
        channels: ['websocket', 'database'],
        data: { paymentId: payment.id, amount: payment.totalAmount || payment.amount, userId: payment.userId }
      }));

      await Promise.all(notifications);

      if (this.io) {
        this.io.to('admin-room').emit('payment-processed', {
          paymentId: payment.id,
          amount: payment.totalAmount || payment.amount,
          userId: payment.userId
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to notify admins: payment processed', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Certificate Ready Notification
   */
  async notifyCertificateReady(certificateData) {
    return await this.sendNotification({
      userId: certificateData.userId,
      type: 'CERTIFICATE_READY',
      title: '🏆 Certificate Ready',
      message: `Your certificate for "${certificateData.examTitle}" is now ready for download.`,
      priority: 'high',
      channels: ['websocket', 'database'],
      data: { certificateId: certificateData.id },
      templateData: certificateData
    });
  }



  /**
   * System Alert Notification (for admins)
   */
  async notifySystemAlert(alertData) {
    // Send to all admin users
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true }
    });

    const notifications = admins.map(admin => 
      this.sendNotification({
        userId: admin.id,
        type: 'SYSTEM_ALERT',
        title: '⚠️ System Alert',
        message: alertData.message,
        priority: 'urgent',
        channels: ['websocket', 'database'],
        data: alertData
      })
    );

    return await Promise.all(notifications);
  }

  /**
   * New User Registration Alert (for admins)
   */
  async notifyAdminsNewUser(userData) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true }
    });

    const notifications = admins.map(admin => 
      this.sendNotification({
        userId: admin.id,
        type: 'NEW_USER_REGISTERED',
        title: '👤 New User Registration',
        message: `${userData.firstName} ${userData.lastName} (${userData.email}) has registered as a ${userData.role}.`,
        priority: 'normal',
        channels: ['websocket', 'database'],
        data: { newUserId: userData.id }
      })
    );

    return await Promise.all(notifications);
  }

  /**
   * New Exam Created Alert (for all students) - GENERAL NOTIFICATION
   */
  async notifyStudentsNewExam(examData) {
    try {
      // Get all active students
      const students = await prisma.user.findMany({
        where: { 
          role: 'STUDENT', 
          isActive: true 
        },
        select: { id: true }
      });

      if (students.length === 0) {
        logger.info('No active students found for exam notification');
        return { success: true, message: 'No students to notify' };
      }

      logger.info(`🔔 Notifying ${students.length} students about new exam: ${examData.title}`);

      // Format the start date for display
      const startDate = examData.scheduledStart ? new Date(examData.scheduledStart).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'TBD';

      // Create notification data
      const notificationData = {
        type: 'SYSTEM_ANNOUNCEMENT', // Changed from 'NEW_EXAM_AVAILABLE' to valid enum value
        title: '📚 New Exam Available',
        message: `New exam "${examData.title}" will be starting on ${startDate}. You can attend this exam!`,
        priority: 'normal',
        timestamp: new Date().toISOString(),
        data: { 
          examId: examData.id,
          examTitle: examData.title,
          examCategory: examData.examCategory?.name || 'General',
          scheduledStart: examData.scheduledStart,
          scheduledEnd: examData.scheduledEnd,
          price: examData.price,
          currency: examData.currency
        }
      };

      // Send individual notifications to each student
      const notifications = students.map(student => 
        this.sendNotification({
          userId: student.id,
          ...notificationData,
          channels: ['websocket', 'database']
        })
      );

      // Send notifications to individual user rooms instead of broadcasting to student-room
      if (this.io) {
        logger.info(`🔔 Sending individual notifications to ${students.length} students`);
        for (const student of students) {
          this.io.to(`user-${student.id}`).emit('new-exam-available', {
            ...notificationData,
            targetUserId: student.id
          });
        }
        logger.info('🔔 Sent individual exam notifications to all students');
      } else {
        logger.warn('🔔 WebSocket not available for individual notifications');
      }

      const results = await Promise.all(notifications);
      const successCount = results.filter(r => r.success).length;
      
      logger.info(`✅ Successfully notified ${successCount}/${students.length} students about new exam`);
      
      return { 
        success: true, 
        message: `Notified ${successCount} students`,
        totalStudents: students.length,
        successCount
      };
    } catch (error) {
      logger.error('Failed to notify students about new exam', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exam Rescheduled Notification
   */
  async notifyExamRescheduled(bookingData, oldScheduledAt, newScheduledAt, reason) {
    const formatDate = (date) => {
      if (!date) return 'TBD';
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    return await this.sendPersonalNotification(bookingData.userId, {
      type: 'EXAM_RESCHEDULED',
      title: '📅 Exam Rescheduled',
      message: `Your exam "${bookingData.exam.title}" has been rescheduled from ${formatDate(oldScheduledAt)} to ${formatDate(newScheduledAt)}.${reason ? ` Reason: ${reason}` : ''}`,
      priority: 'high',
      data: {
        bookingId: bookingData.id,
        examId: bookingData.examId,
        examTitle: bookingData.exam.title,
        oldScheduledAt,
        newScheduledAt,
        reason
      }
    });
  }

  /**
   * Send personal notification to a specific student
   */
  async sendPersonalNotification(userId, notificationData) {
    try {
      logger.info(`🔔 Sending personal notification to user ${userId}:`, notificationData.title);
      
      return await this.sendNotification({
        userId,
        ...notificationData,
        channels: ['websocket', 'database', 'push'], // Include push notifications
        priority: notificationData.priority || 'normal'
      });
    } catch (error) {
      logger.error('Failed to send personal notification', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enhanced Exam Reminder Notification (personal to specific student)
   */
  async notifyExamReminder(bookingData, reminderType = '24h') {
    const timeMap = {
      '24h': '24 hours',
      '1h': '1 hour',
      '15m': '15 minutes',
      '5m': '5 minutes'
    };

    // Determine priority based on reminder type
    let priority = 'normal';
    if (reminderType === '5m') {
      priority = 'high'; // 5-minute reminder is urgent
    } else if (reminderType === '15m') {
      priority = 'high';
    } else if (reminderType === '1h') {
      priority = 'normal';
    } else if (reminderType === '24h') {
      priority = 'low';
    }
    
    return await this.sendPersonalNotification(bookingData.userId, {
      type: 'EXAM_REMINDER',
      title: '⏰ Exam Reminder',
      message: `Your exam "${bookingData.exam.title}" is scheduled in ${timeMap[reminderType]}.`,
      priority,
      data: { 
        bookingId: bookingData.id, 
        examId: bookingData.exam.id,
        examTitle: bookingData.exam.title,
        reminderType,
        scheduledAt: bookingData.scheduledAt
      }
    });
  }

  /**
   * Send upcoming exam notifications to students
   */
  async notifyUpcomingExams(userId, upcomingExams) {
    try {
      if (!upcomingExams || upcomingExams.length === 0) {
        return { success: true, message: 'No upcoming exams to notify about' };
      }

      const notifications = [];
      
      for (const exam of upcomingExams.slice(0, 3)) { // Notify about next 3 exams
        const timeUntilExam = new Date(exam.scheduledStart).getTime() - new Date().getTime();
        const hoursUntilExam = timeUntilExam / (1000 * 60 * 60);
        
        let priority = 'normal';
        let message = '';
        
        if (hoursUntilExam <= 1) {
          priority = 'high';
          message = `Your exam "${exam.title}" starts in less than 1 hour!`;
        } else if (hoursUntilExam <= 24) {
          priority = 'normal';
          message = `Your exam "${exam.title}" is scheduled for tomorrow.`;
        } else {
          priority = 'low';
          message = `Your exam "${exam.title}" is scheduled for ${new Date(exam.scheduledStart).toLocaleDateString()}.`;
        }

        const notification = await this.sendPersonalNotification(userId, {
          type: 'EXAM_REMINDER',
          title: '📅 Upcoming Exam',
          message,
          priority,
          data: {
            examId: exam.id,
            examTitle: exam.title,
            scheduledStart: exam.scheduledStart,
            category: exam.examCategory?.name || 'General'
          }
        });

        if (notification.success) {
          notifications.push(notification);
        }
      }

      return {
        success: true,
        message: `Sent ${notifications.length} upcoming exam notifications`,
        notifications
      };
    } catch (error) {
      logger.error('Failed to send upcoming exam notifications', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send exam result notification
   */

  // ============================================================================
  // NOTIFICATION MANAGEMENT METHODS
  // ============================================================================

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status = null,
        type = null,
        priority = null
      } = options;

      const skip = (page - 1) * limit;
      const where = { userId };

      if (status) where.status = status;
      if (type) where.type = type;
      if (priority) where.priority = priority;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notification.count({ where })
      ]);

      return {
        success: true,
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get user notifications', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      await prisma.notification.update({
        where: { id: notificationId, userId },
        data: { status: 'READ', readAt: new Date() }
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to mark notification as read', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    try {
      await prisma.notification.updateMany({
        where: { userId, status: 'UNREAD' },
        data: { status: 'READ', readAt: new Date() }
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to mark all notifications as read', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      await prisma.notification.delete({
        where: { id: notificationId, userId }
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete notification', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId) {
    try {
      const [total, unread, byType, byPriority] = await Promise.all([
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, status: 'UNREAD' } }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { userId },
          _count: { id: true }
        }),
        prisma.notification.groupBy({
          by: ['priority'],
          where: { userId },
          _count: { id: true }
        })
      ]);

      return {
        success: true,
        stats: {
          total,
          unread,
          byType: byType.reduce((acc, item) => {
            acc[item.type] = item._count.id;
            return acc;
          }, {}),
          byPriority: byPriority.reduce((acc, item) => {
            acc[item.priority] = item._count.id;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      logger.error('Failed to get notification stats', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = AdvancedNotificationService;