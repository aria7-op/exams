const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const cron = require('node-cron');

const prisma = new PrismaClient();

class NotificationSchedulerService {
  constructor() {
    this.isRunning = false;
    this.jobs = new Map();
  }

  /**
   * Start the notification scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('Notification scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🕒 Starting notification scheduler');

    // Schedule exam reminders - runs every 15 minutes
    this.jobs.set('exam-reminders', cron.schedule('*/15 * * * *', async () => {
      await this.processExamReminders();
    }, { scheduled: false }));

    // Schedule cleanup of old notifications - runs daily at 2 AM
    this.jobs.set('cleanup-notifications', cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldNotifications();
    }, { scheduled: false }));

    // Schedule system health checks - runs every hour
    this.jobs.set('system-health', cron.schedule('0 * * * *', async () => {
      await this.performSystemHealthCheck();
    }, { scheduled: false }));

    // Start all scheduled jobs
    this.jobs.forEach((job, name) => {
      job.start();
      logger.info(`📅 Started scheduled job: ${name}`);
    });
  }

  /**
   * Stop the notification scheduler
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Notification scheduler is not running');
      return;
    }

    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`⏹️ Stopped scheduled job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;
    logger.info('🛑 Notification scheduler stopped');
  }

  /**
   * Process exam reminders
   */
  async processExamReminders() {
    try {
      logger.info('🔔 Processing exam reminders...');

      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
      const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);

      // Find upcoming exams that need reminders
      const upcomingBookings = await prisma.examBooking.findMany({
        where: {
          status: 'CONFIRMED',
          scheduledAt: {
            gte: now,
            lte: in24Hours
          }
        },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true }
          },
          exam: {
            select: { id: true, title: true, duration: true }
          }
        }
      });

      for (const booking of upcomingBookings) {
        const timeUntilExam = booking.scheduledAt.getTime() - now.getTime();
        const hoursUntilExam = timeUntilExam / (1000 * 60 * 60);

        let reminderType = null;
        let shouldSendReminder = false;

        // Check if we should send a 24-hour reminder
        if (hoursUntilExam <= 24 && hoursUntilExam > 23) {
          reminderType = '24h';
          shouldSendReminder = !(await this.hasRecentReminder(booking.id, '24h'));
        }
        // Check if we should send a 1-hour reminder
        else if (hoursUntilExam <= 1 && hoursUntilExam > 0.75) {
          reminderType = '1h';
          shouldSendReminder = !(await this.hasRecentReminder(booking.id, '1h'));
        }
        // Check if we should send a 15-minute reminder
        else if (hoursUntilExam <= 0.25 && hoursUntilExam > 0.1) {
          reminderType = '15m';
          shouldSendReminder = !(await this.hasRecentReminder(booking.id, '15m'));
        }
        // Check if we should send a 5-minute reminder
        else if (hoursUntilExam <= 0.083 && hoursUntilExam > 0.05) { // 5 minutes = 0.083 hours
          reminderType = '5m';
          shouldSendReminder = !(await this.hasRecentReminder(booking.id, '5m'));
        }

        if (shouldSendReminder && global.notificationService) {
          await global.notificationService.notifyExamReminder(booking, reminderType);
          await this.recordReminderSent(booking.id, reminderType);
        }
      }

      logger.info(`✅ Processed ${upcomingBookings.length} upcoming bookings for reminders`);
    } catch (error) {
      logger.error('❌ Failed to process exam reminders', error);
    }
  }

  /**
   * Check if a reminder was recently sent
   */
  async hasRecentReminder(bookingId, reminderType) {
    try {
      const recentReminder = await prisma.notification.findFirst({
        where: {
          type: 'EXAM_REMINDER',
          data: {
            path: ['bookingId'],
            equals: bookingId
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000) // Within last 30 minutes
          }
        }
      });

      return !!recentReminder;
    } catch (error) {
      logger.error('Failed to check recent reminder', error);
      return false;
    }
  }

  /**
   * Record that a reminder was sent
   */
  async recordReminderSent(bookingId, reminderType) {
    try {
      await prisma.notificationLog.create({
        data: {
          type: 'EXAM_REMINDER',
          reference: bookingId,
          metadata: { reminderType },
          sentAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to record reminder sent', error);
    }
  }

  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications() {
    try {
      logger.info('🧹 Cleaning up old notifications...');

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Delete read notifications older than 30 days
      const deletedReadNotifications = await prisma.notification.deleteMany({
        where: {
          status: 'READ',
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });

      // Delete expired notifications
      const deletedExpiredNotifications = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      // Delete old notification delivery logs
      const deletedDeliveryLogs = await prisma.notificationDeliveryLog.deleteMany({
        where: {
          createdAt: {
            lt: sevenDaysAgo
          }
        }
      });

      logger.info('✅ Cleanup completed', {
        deletedReadNotifications: deletedReadNotifications.count,
        deletedExpiredNotifications: deletedExpiredNotifications.count,
        deletedDeliveryLogs: deletedDeliveryLogs.count
      });
    } catch (error) {
      logger.error('❌ Failed to cleanup old notifications', error);
    }
  }

  /**
   * Perform system health check
   */
  async performSystemHealthCheck() {
    try {
      logger.info('🏥 Performing system health check...');

      const stats = await this.getSystemStats();
      
      // Check if we have too many unread notifications
      if (stats.totalUnreadNotifications > 10000) {
        await this.sendSystemAlert({
          type: 'HIGH_UNREAD_NOTIFICATIONS',
          message: `System has ${stats.totalUnreadNotifications} unread notifications`,
          severity: 'warning'
        });
      }

      // Check if notification delivery failure rate is high
      if (stats.deliveryFailureRate > 0.1) { // 10% failure rate
        await this.sendSystemAlert({
          type: 'HIGH_DELIVERY_FAILURE_RATE',
          message: `Notification delivery failure rate is ${(stats.deliveryFailureRate * 100).toFixed(1)}%`,
          severity: 'error'
        });
      }

      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      logger.info('✅ System health check completed', stats);
    } catch (error) {
      logger.error('❌ System health check failed', error);
      await this.sendSystemAlert({
        type: 'SYSTEM_HEALTH_CHECK_FAILED',
        message: `System health check failed: ${error.message}`,
        severity: 'critical'
      });
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    try {
      const [
        totalNotifications,
        totalUnreadNotifications,
        recentDeliveryAttempts,
        recentDeliveryFailures
      ] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { status: 'UNREAD' } }),
        prisma.notificationDeliveryLog.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }),
        prisma.notificationDeliveryLog.count({
          where: {
            status: 'failed',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      ]);

      const deliveryFailureRate = recentDeliveryAttempts > 0 
        ? recentDeliveryFailures / recentDeliveryAttempts 
        : 0;

      return {
        totalNotifications,
        totalUnreadNotifications,
        recentDeliveryAttempts,
        recentDeliveryFailures,
        deliveryFailureRate
      };
    } catch (error) {
      logger.error('Failed to get system stats', error);
      return {
        totalNotifications: 0,
        totalUnreadNotifications: 0,
        recentDeliveryAttempts: 0,
        recentDeliveryFailures: 0,
        deliveryFailureRate: 0
      };
    }
  }

  /**
   * Send system alert to admins
   */
  async sendSystemAlert(alertData) {
    try {
      if (global.notificationService) {
        await global.notificationService.notifySystemAlert(alertData);
      }
    } catch (error) {
      logger.error('Failed to send system alert', error);
    }
  }

  /**
   * Schedule a custom notification
   */
  async scheduleNotification(notificationData, scheduleAt) {
    try {
      const notification = await prisma.notification.create({
        data: {
          ...notificationData,
          scheduleAt,
          status: 'SCHEDULED'
        }
      });

      logger.info('📅 Notification scheduled', {
        notificationId: notification.id,
        scheduleAt
      });

      return { success: true, notification };
    } catch (error) {
      logger.error('Failed to schedule notification', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications = await prisma.notification.findMany({
        where: {
          status: 'SCHEDULED',
          scheduleAt: {
            lte: now
          }
        }
      });

      for (const notification of scheduledNotifications) {
        if (global.notificationService) {
          await global.notificationService.sendNotification({
            ...notification,
            channels: ['websocket', 'database', 'email']
          });
        }

        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: 'SENT' }
        });
      }

      if (scheduledNotifications.length > 0) {
        logger.info(`✅ Processed ${scheduledNotifications.length} scheduled notifications`);
      }
    } catch (error) {
      logger.error('❌ Failed to process scheduled notifications', error);
    }
  }
}

module.exports = NotificationSchedulerService;