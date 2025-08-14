const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const EmailService = require('./emailService');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();
const emailService = new EmailService();

class NotificationService {
  constructor() {
    this.isEnabled = process.env.NOTIFICATIONS_ENABLED !== 'false';
    this.channels = {
      websocket: true,
      email: true,
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
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(email, bookingData) {
    try {
      if (!this.isEnabled) {
        logger.info('Notifications disabled, skipping booking confirmation', { email });
        return { success: true, message: 'Notification skipped (disabled)' };
      }

      logger.info('Sending booking confirmation notification', {
        email,
        bookingId: bookingData.bookingId,
        examTitle: bookingData.examTitle
      });

      // In a real implementation, this would send an email/SMS/push notification
      // For now, we'll just log it
      return { success: true, message: 'Booking confirmation notification sent' };
    } catch (error) {
      logger.error('Failed to send booking confirmation notification', error);
      return { success: false, message: 'Failed to send notification' };
    }
  }

  /**
   * Send booking cancellation notification
   */
  async sendBookingCancellation(email, bookingData) {
    try {
      if (!this.isEnabled) {
        logger.info('Notifications disabled, skipping booking cancellation', { email });
        return { success: true, message: 'Notification skipped (disabled)' };
      }

      logger.info('Sending booking cancellation notification', {
        email,
        bookingId: bookingData.bookingId,
        examTitle: bookingData.examTitle
      });

      // In a real implementation, this would send an email/SMS/push notification
      // For now, we'll just log it
      return { success: true, message: 'Booking cancellation notification sent' };
    } catch (error) {
      logger.error('Failed to send booking cancellation notification', error);
      return { success: false, message: 'Failed to send notification' };
    }
  }

  /**
   * Send exam reminder notification
   */
  async sendExamReminder(email, examData) {
    try {
      if (!this.isEnabled) {
        logger.info('Notifications disabled, skipping exam reminder', { email });
        return { success: true, message: 'Notification skipped (disabled)' };
      }

      logger.info('Sending exam reminder notification', {
        email,
        examId: examData.examId,
        examTitle: examData.examTitle,
        startTime: examData.startTime
      });

      return { success: true, message: 'Exam reminder notification sent' };
    } catch (error) {
      logger.error('Failed to send exam reminder notification', error);
      return { success: false, message: 'Failed to send notification' };
    }
  }

  /**
   * Send exam completion notification
   */
  async sendExamCompletion(email, examData) {
    try {
      if (!this.isEnabled) {
        logger.info('Notifications disabled, skipping exam completion', { email });
        return { success: true, message: 'Notification skipped (disabled)' };
      }

      logger.info('Sending exam completion notification', {
        email,
        examId: examData.examId,
        examTitle: examData.examTitle,
        score: examData.score,
        isPassed: examData.isPassed
      });

      return { success: true, message: 'Exam completion notification sent' };
    } catch (error) {
      logger.error('Failed to send exam completion notification', error);
      return { success: false, message: 'Failed to send notification' };
    }
  }

  /**
   * Send certificate notification
   */
  async sendCertificateNotification(email, certificateData) {
    try {
      if (!this.isEnabled) {
        logger.info('Notifications disabled, skipping certificate notification', { email });
        return { success: true, message: 'Notification skipped (disabled)' };
      }

      logger.info('Sending certificate notification', {
        email,
        certificateId: certificateData.certificateId,
        examTitle: certificateData.examTitle,
        certificateNumber: certificateData.certificateNumber
      });

      return { success: true, message: 'Certificate notification sent' };
    } catch (error) {
      logger.error('Failed to send certificate notification', error);
      return { success: false, message: 'Failed to send notification' };
    }
  }

  /**
   * Send exam creation notification to all students
   */
  async sendExamCreationNotification(examData) {
    try {
      if (!this.isEnabled) {
        logger.info('Notifications disabled, skipping exam creation notification');
        return { success: true, message: 'Notification skipped (disabled)' };
      }

      logger.info('Sending exam creation notification', {
        examId: examData.id,
        examTitle: examData.title,
        category: examData.examCategory?.name
      });

      // Send WebSocket notification to all connected students
      if (this.io) {
        // Emit to all connected clients (students and admins)
        this.io.emit('new-exam-created', {
          type: 'EXAM_CREATED',
          title: 'New Exam Available!',
          message: `A new exam "${examData.title}" is now available in ${examData.examCategory?.name || 'General'} category.`,
          examId: examData.id,
          examTitle: examData.title,
          categoryName: examData.examCategory?.name,
          scheduledStart: examData.scheduledStart,
          scheduledEnd: examData.scheduledEnd,
          price: examData.price,
          duration: examData.duration,
          totalMarks: examData.totalMarks,
          timestamp: new Date().toISOString()
        });

        logger.info('WebSocket notification sent for new exam creation');
      }

      // Store notification in database for all active students
      try {
        const activeStudents = await prisma.user.findMany({
          where: {
            role: 'STUDENT',
            isActive: true
          },
          select: { id: true, email: true, firstName: true, lastName: true }
        });

        const notifications = activeStudents.map(student => ({
          userId: student.id,
          type: 'EXAM_CREATED',
          title: 'New Exam Available!',
          message: `A new exam "${examData.title}" is now available in ${examData.examCategory?.name || 'General'} category.`,
          data: {
            examId: examData.id,
            examTitle: examData.title,
            categoryName: examData.examCategory?.name,
            scheduledStart: examData.scheduledStart,
            scheduledEnd: examData.scheduledEnd,
            price: examData.price,
            duration: examData.duration,
            totalMarks: examData.totalMarks
          },
          isRead: false,
          createdAt: new Date()
        }));

        await prisma.notification.createMany({
          data: notifications
        });

        logger.info(`Database notifications created for ${activeStudents.length} students`);
      } catch (dbError) {
        logger.error('Failed to create database notifications:', dbError);
        // Don't fail the main operation if notifications fail
      }

      return { success: true, message: 'Exam creation notification sent' };
    } catch (error) {
      logger.error('Failed to send exam creation notification', error);
      return { success: false, message: 'Failed to send notification' };
    }
  }
}

module.exports = new NotificationService(); 