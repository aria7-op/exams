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
}

module.exports = new NotificationService(); 