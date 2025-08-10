const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format } = require('date-fns');

const prisma = new PrismaClient();

class CalendarService {
  /**
   * Get calendar bookings for a date range
   */
  async getCalendarBookings(options = {}) {
    try {
      const {
        startDate,
        endDate,
        status,
        examCategoryId,
        userId,
        page = 1,
        limit = 1000
      } = options;

      const where = {};

      // Date range filter
      if (startDate || endDate) {
        where.scheduledAt = {};
        if (startDate) where.scheduledAt.gte = new Date(startDate);
        if (endDate) where.scheduledAt.lte = new Date(endDate);
      }

      // Status filter
      if (status && status !== 'all') {
        where.status = status;
      }

      // User filter
      if (userId) {
        where.userId = userId;
      }

      // Exam category filter
      if (examCategoryId && examCategoryId !== 'all') {
        where.exam = {
          examCategoryId
        };
      }

      const bookings = await prisma.examBooking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          exam: {
            include: {
              examCategory: {
                select: {
                  id: true,
                  name: true,
                  color: true
                }
              }
            }
          }
        },
        orderBy: {
          scheduledAt: 'asc'
        },
        skip: (page - 1) * limit,
        take: limit
      });

      const total = await prisma.examBooking.count({ where });

      return {
        success: true,
        data: bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get calendar bookings failed', error);
      return { success: false, message: 'Failed to get calendar bookings' };
    }
  }

  /**
   * Get calendar statistics for a date range
   */
  async getCalendarStats(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get all bookings in the date range
      const bookings = await prisma.examBooking.findMany({
        where: {
          scheduledAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          exam: {
            select: {
              examCategoryId: true,
              examCategory: {
                select: {
                  name: true,
                  color: true
                }
              }
            }
          }
        }
      });

      // Calculate statistics
      const stats = {
        total: bookings.length,
        byStatus: {
          PENDING: 0,
          CONFIRMED: 0,
          CANCELLED: 0,
          COMPLETED: 0
        },
        byCategory: {},
        busyDays: new Set(),
        dailyStats: {}
      };

      bookings.forEach(booking => {
        // Status statistics
        stats.byStatus[booking.status]++;

        // Category statistics
        const categoryName = booking.exam?.examCategory?.name || 'Unknown';
        if (!stats.byCategory[categoryName]) {
          stats.byCategory[categoryName] = 0;
        }
        stats.byCategory[categoryName]++;

        // Daily statistics
        if (booking.scheduledAt) {
          const dateKey = format(booking.scheduledAt, 'yyyy-MM-dd');
          stats.busyDays.add(dateKey);
          
          if (!stats.dailyStats[dateKey]) {
            stats.dailyStats[dateKey] = {
              total: 0,
              confirmed: 0,
              pending: 0,
              cancelled: 0
            };
          }
          
          stats.dailyStats[dateKey].total++;
          stats.dailyStats[dateKey][booking.status.toLowerCase()]++;
        }
      });

      // Calculate free days
      const totalDays = eachDayOfInterval({ start, end }).length;
      stats.freeDays = totalDays - stats.busyDays.size;
      stats.busyDaysCount = stats.busyDays.size;

      // Convert Set to Array for JSON serialization
      stats.busyDays = Array.from(stats.busyDays);

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Get calendar stats failed', error);
      return { success: false, message: 'Failed to get calendar statistics' };
    }
  }

  /**
   * Get availability for a specific date
   */
  async getDateAvailability(date, examId = null) {
    try {
      const targetDate = new Date(date);
      const dayStart = startOfDay(targetDate);
      const dayEnd = endOfDay(targetDate);

      const where = {
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      };

      if (examId) {
        where.examId = examId;
      }

      const bookings = await prisma.examBooking.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          exam: {
            select: {
              title: true,
              duration: true,
              examCategory: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          scheduledAt: 'asc'
        }
      });

      // Calculate time slots and conflicts
      const timeSlots = {};
      bookings.forEach(booking => {
        const hour = format(booking.scheduledAt, 'HH:mm');
        if (!timeSlots[hour]) {
          timeSlots[hour] = [];
        }
        timeSlots[hour].push(booking);
      });

      return {
        success: true,
        data: {
          date: targetDate,
          totalBookings: bookings.length,
          bookings,
          timeSlots,
          isAvailable: bookings.length === 0,
          conflicts: Object.values(timeSlots).filter(slot => slot.length > 1)
        }
      };
    } catch (error) {
      logger.error('Get date availability failed', error);
      return { success: false, message: 'Failed to get date availability' };
    }
  }

  /**
   * Get weekly calendar view
   */
  async getWeeklyCalendar(date) {
    try {
      const targetDate = new Date(date);
      const weekStart = startOfWeek(targetDate);
      const weekEnd = endOfWeek(targetDate);

      const bookings = await this.getCalendarBookings({
        startDate: weekStart,
        endDate: weekEnd
      });

      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
      const weeklyData = days.map(day => {
        const dayBookings = bookings.data.filter(booking => {
          if (!booking.scheduledAt) return false;
          const bookingDate = new Date(booking.scheduledAt);
          return format(bookingDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
        });

        return {
          date: day,
          dayName: format(day, 'EEEE'),
          bookings: dayBookings,
          count: dayBookings.length,
          status: dayBookings.length > 0 ? 'busy' : 'free'
        };
      });

      return {
        success: true,
        data: {
          weekStart,
          weekEnd,
          days: weeklyData,
          totalBookings: bookings.data.length
        }
      };
    } catch (error) {
      logger.error('Get weekly calendar failed', error);
      return { success: false, message: 'Failed to get weekly calendar' };
    }
  }

  /**
   * Get monthly calendar view
   */
  async getMonthlyCalendar(date) {
    try {
      const targetDate = new Date(date);
      const monthStart = startOfMonth(targetDate);
      const monthEnd = endOfMonth(targetDate);

      const [bookingsResult, statsResult] = await Promise.all([
        this.getCalendarBookings({
          startDate: monthStart,
          endDate: monthEnd
        }),
        this.getCalendarStats(monthStart, monthEnd)
      ]);

      return {
        success: true,
        data: {
          month: format(targetDate, 'MMMM yyyy'),
          monthStart,
          monthEnd,
          bookings: bookingsResult.data || [],
          stats: statsResult.data || {}
        }
      };
    } catch (error) {
      logger.error('Get monthly calendar failed', error);
      return { success: false, message: 'Failed to get monthly calendar' };
    }
  }

  /**
   * Check for scheduling conflicts
   */
  async checkSchedulingConflicts(examId, scheduledAt, excludeBookingId = null) {
    try {
      const targetTime = new Date(scheduledAt);
      
      // Get exam duration to check for overlaps
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: { duration: true }
      });

      if (!exam) {
        return { success: false, message: 'Exam not found' };
      }

      // Check for conflicts within a reasonable time window
      const bufferMinutes = 30; // 30 minute buffer between exams
      const totalDuration = exam.duration + bufferMinutes;
      
      const conflictStart = new Date(targetTime.getTime() - totalDuration * 60000);
      const conflictEnd = new Date(targetTime.getTime() + totalDuration * 60000);

      const where = {
        examId,
        scheduledAt: {
          gte: conflictStart,
          lte: conflictEnd
        },
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      };

      if (excludeBookingId) {
        where.id = {
          not: excludeBookingId
        };
      }

      const conflicts = await prisma.examBooking.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      return {
        success: true,
        data: {
          hasConflicts: conflicts.length > 0,
          conflicts,
          conflictCount: conflicts.length
        }
      };
    } catch (error) {
      logger.error('Check scheduling conflicts failed', error);
      return { success: false, message: 'Failed to check scheduling conflicts' };
    }
  }

  /**
   * Get exam categories for filtering
   */
  async getExamCategoriesForCalendar() {
    try {
      const categories = await prisma.examCategory.findMany({
        select: {
          id: true,
          name: true,
          color: true,
          _count: {
            select: {
              exams: {
                where: {
                  isActive: true
                }
              }
            }
          }
        },
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return {
        success: true,
        data: categories
      };
    } catch (error) {
      logger.error('Get exam categories for calendar failed', error);
      return { success: false, message: 'Failed to get exam categories' };
    }
  }

  /**
   * Update booking status with calendar context
   */
  async updateBookingStatus(bookingId, status, notes, adminId) {
    try {
      const booking = await prisma.examBooking.findUnique({
        where: { id: bookingId },
        include: {
          exam: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      // Check for conflicts if confirming a booking
      if (status === 'CONFIRMED' && booking.scheduledAt) {
        const conflictCheck = await this.checkSchedulingConflicts(
          booking.examId,
          booking.scheduledAt,
          bookingId
        );

        if (conflictCheck.success && conflictCheck.data.hasConflicts) {
          return {
            success: false,
            message: 'Cannot confirm booking due to scheduling conflicts',
            conflicts: conflictCheck.data.conflicts
          };
        }
      }

      const updatedBooking = await prisma.examBooking.update({
        where: { id: bookingId },
        data: {
          status,
          notes: notes || booking.notes,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          exam: {
            include: {
              examCategory: true
            }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'BOOKING_STATUS_UPDATE',
          resource: 'ExamBooking',
          resourceId: bookingId,
          details: {
            oldStatus: booking.status,
            newStatus: status,
            notes,
            scheduledAt: booking.scheduledAt
          }
        }
      });

      return {
        success: true,
        data: updatedBooking
      };
    } catch (error) {
      logger.error('Update booking status failed', error);
      return { success: false, message: 'Failed to update booking status' };
    }
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(bookingId, newScheduledAt, adminId, notes = null) {
    try {
      const booking = await prisma.examBooking.findUnique({
        where: { id: bookingId },
        include: {
          exam: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      // Check for conflicts at the new time
      const conflictCheck = await this.checkSchedulingConflicts(
        booking.examId,
        newScheduledAt,
        bookingId
      );

      if (conflictCheck.success && conflictCheck.data.hasConflicts) {
        return {
          success: false,
          message: 'Cannot reschedule due to conflicts at the new time',
          conflicts: conflictCheck.data.conflicts
        };
      }

      const updatedBooking = await prisma.examBooking.update({
        where: { id: bookingId },
        data: {
          scheduledAt: new Date(newScheduledAt),
          notes: notes || booking.notes,
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          exam: {
            include: {
              examCategory: true
            }
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'BOOKING_RESCHEDULE',
          resource: 'ExamBooking',
          resourceId: bookingId,
          details: {
            oldScheduledAt: booking.scheduledAt,
            newScheduledAt,
            notes
          }
        }
      });

      return {
        success: true,
        data: updatedBooking
      };
    } catch (error) {
      logger.error('Reschedule booking failed', error);
      return { success: false, message: 'Failed to reschedule booking' };
    }
  }
}

module.exports = CalendarService;