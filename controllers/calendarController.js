const CalendarService = require('../services/calendarService');
const logger = require('../config/logger');

const calendarService = new CalendarService();

class CalendarController {
  /**
   * Get calendar bookings for admin/moderator view
   */
  async getCalendarBookings(req, res) {
    try {
      const {
        startDate,
        endDate,
        status,
        examCategoryId,
        userId,
        page = 1,
        limit = 1000
      } = req.query;

      const result = await calendarService.getCalendarBookings({
        startDate,
        endDate,
        status,
        examCategoryId,
        userId,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Get calendar bookings failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get calendar bookings'
        }
      });
    }
  }

  /**
   * Get calendar statistics
   */
  async getCalendarStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Start date and end date are required'
          }
        });
      }

      const result = await calendarService.getCalendarStats(startDate, endDate);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error('Get calendar stats failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get calendar statistics'
        }
      });
    }
  }

  /**
   * Get weekly calendar view
   */
  async getWeeklyCalendar(req, res) {
    try {
      const { date } = req.params;

      if (!date) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Date parameter is required'
          }
        });
      }

      const result = await calendarService.getWeeklyCalendar(date);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error('Get weekly calendar failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get weekly calendar'
        }
      });
    }
  }

  /**
   * Get monthly calendar view
   */
  async getMonthlyCalendar(req, res) {
    try {
      const { date } = req.params;

      if (!date) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Date parameter is required'
          }
        });
      }

      const result = await calendarService.getMonthlyCalendar(date);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error('Get monthly calendar failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get monthly calendar'
        }
      });
    }
  }

  /**
   * Get date availability
   */
  async getDateAvailability(req, res) {
    try {
      const { date } = req.params;
      const { examId } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Date parameter is required'
          }
        });
      }

      const result = await calendarService.getDateAvailability(date, examId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error('Get date availability failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get date availability'
        }
      });
    }
  }

  /**
   * Get exam categories for calendar filtering
   */
  async getExamCategories(req, res) {
    try {
      const result = await calendarService.getExamCategoriesForCalendar();

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error('Get exam categories failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get exam categories'
        }
      });
    }
  }

  /**
   * Check for scheduling conflicts
   */
  async checkConflicts(req, res) {
    try {
      const { examId, scheduledAt, excludeBookingId } = req.body;

      if (!examId || !scheduledAt) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Exam ID and scheduled time are required'
          }
        });
      }

      const result = await calendarService.checkSchedulingConflicts(
        examId,
        scheduledAt,
        excludeBookingId
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      logger.error('Check conflicts failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to check conflicts'
        }
      });
    }
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(req, res) {
    try {
      const { bookingId } = req.params;
      const { newScheduledAt, notes } = req.body;
      const adminId = req.user.id;

      if (!newScheduledAt) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'New scheduled time is required'
          }
        });
      }

      const result = await calendarService.rescheduleBooking(
        bookingId,
        newScheduledAt,
        adminId,
        notes
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message,
            conflicts: result.conflicts
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Booking rescheduled successfully',
        data: result.data
      });
    } catch (error) {
      logger.error('Reschedule booking failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to reschedule booking'
        }
      });
    }
  }

  /**
   * Update booking status from calendar
   */
  async updateBookingStatus(req, res) {
    try {
      const { bookingId } = req.params;
      const { status, notes } = req.body;
      const adminId = req.user.id;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Status is required'
          }
        });
      }

      const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid status'
          }
        });
      }

      const result = await calendarService.updateBookingStatus(
        bookingId,
        status,
        notes,
        adminId
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message,
            conflicts: result.conflicts
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Booking status updated successfully',
        data: result.data
      });
    } catch (error) {
      logger.error('Update booking status failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update booking status'
        }
      });
    }
  }

  /**
   * Get calendar overview/dashboard data
   */
  async getCalendarOverview(req, res) {
    try {
      const { period = 'month' } = req.query;
      const today = new Date();
      
      let startDate, endDate;
      
      if (period === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startDate = startOfWeek;
        endDate = new Date(startOfWeek);
        endDate.setDate(startOfWeek.getDate() + 6);
      } else {
        // Default to month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }

      const [bookingsResult, statsResult] = await Promise.all([
        calendarService.getCalendarBookings({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }),
        calendarService.getCalendarStats(
          startDate.toISOString(),
          endDate.toISOString()
        )
      ]);

      res.status(200).json({
        success: true,
        data: {
          period,
          startDate,
          endDate,
          bookings: bookingsResult.data || [],
          stats: statsResult.data || {},
          overview: {
            totalBookings: statsResult.data?.total || 0,
            confirmedBookings: statsResult.data?.byStatus?.CONFIRMED || 0,
            pendingBookings: statsResult.data?.byStatus?.PENDING || 0,
            busyDays: statsResult.data?.busyDaysCount || 0,
            freeDays: statsResult.data?.freeDays || 0
          }
        }
      });
    } catch (error) {
      logger.error('Get calendar overview failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get calendar overview'
        }
      });
    }
  }
}

module.exports = new CalendarController();