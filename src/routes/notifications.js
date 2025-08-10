const express = require('express');
const router = express.Router();
const logger = require('../config/logger');
const { auth } = require('../middleware/auth');

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, status, type, priority } = req.query;
    
    const result = await global.notificationService.getUserNotifications(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      type,
      priority
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Get notifications failed', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get notifications' }
    });
  }
});

// Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await global.notificationService.getNotificationStats(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }

    res.status(200).json({
      success: true,
      data: result.stats
    });
  } catch (error) {
    logger.error('Get notification stats failed', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get notification statistics' }
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;
    
    const result = await global.notificationService.markAsRead(notificationId, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error('Mark notification as read failed', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark notification as read' }
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await global.notificationService.markAllAsRead(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    logger.error('Mark all notifications as read failed', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark all notifications as read' }
    });
  }
});

// Delete notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;
    
    const result = await global.notificationService.deleteNotification(notificationId, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    logger.error('Delete notification failed', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete notification' }
    });
  }
});

// Send test notification (admin only)
router.post('/test', async (req, res) => {
  try {
    // Check if user is admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied. Admin role required.' }
      });
    }

    const { userId, title, message, type = 'SYSTEM_ALERT', priority = 'normal' } = req.body;
    
    const result = await global.notificationService.sendNotification({
      userId: userId || req.user.id,
      type,
      title,
      message,
      priority,
      channels: ['websocket', 'database']
    });

    res.status(200).json({
      success: true,
      message: 'Test notification sent',
      data: result
    });
  } catch (error) {
    logger.error('Send test notification failed', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send test notification' }
    });
  }
});

module.exports = router;