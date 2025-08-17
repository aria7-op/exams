const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

class ExamBookingService {
  /**
   * Check if user can book an exam
   */
  async canUserBookExam(userId, examId) {
    try {
      // Get exam details
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          attempts: {
            where: { userId }
          }
        }
      });

      if (!exam) {
        return { success: false, message: 'Exam not found' };
      }

      if (!exam.isActive) {
        return { success: false, message: 'Exam is not active' };
      }

      // Check if user has already taken this exam
      const existingAttempts = exam.attempts.filter(attempt => 
        attempt.status === 'COMPLETED' || attempt.status === 'IN_PROGRESS'
      );

      if (existingAttempts.length > 0 && !exam.allowRetakes) {
        return { success: false, message: 'You have already taken this exam and retakes are not allowed' };
      }

      if (existingAttempts.length >= exam.maxRetakes) {
        return { success: false, message: `You have reached the maximum number of retakes (${exam.maxRetakes})` };
      }

      // Check if exam is within scheduled time window
      const now = new Date();
      
      // Debug logging
      logger.info(`Exam booking check for exam ${examId}:`, {
        examTitle: exam.title,
        scheduledStart: exam.scheduledStart,
        scheduledEnd: exam.scheduledEnd,
        currentTime: now,
        isActive: exam.isActive,
        isPublic: exam.isPublic,
        allowRetakes: exam.allowRetakes,
        maxRetakes: exam.maxRetakes,
        userAttempts: existingAttempts.length
      });
      
      // Handle scheduled start date
      if (exam.scheduledStart) {
        const scheduledStart = new Date(exam.scheduledStart);
        if (now < scheduledStart) {
          const timeUntilStart = Math.ceil((scheduledStart - now) / (1000 * 60 * 60 * 24)); // Days until start
          if (timeUntilStart > 1) {
            return { 
              success: false, 
              message: `Exam will be available for booking in ${timeUntilStart} days (starts ${scheduledStart.toLocaleDateString()})` 
            };
          } else {
            const hoursUntilStart = Math.ceil((scheduledStart - now) / (1000 * 60 * 60));
            return { 
              success: false, 
              message: `Exam will be available for booking in ${hoursUntilStart} hours (starts ${scheduledStart.toLocaleDateString()})` 
            };
          }
        }
      }

      // Handle scheduled end date
      if (exam.scheduledEnd) {
        const scheduledEnd = new Date(exam.scheduledEnd);
        if (now > scheduledEnd) {
          return { 
            success: false, 
            message: `Exam booking period ended on ${scheduledEnd.toLocaleDateString()}` 
          };
        }
      }

      // If no scheduled dates are set, exam is always available
      if (!exam.scheduledStart && !exam.scheduledEnd) {
        logger.info(`Exam ${examId} has no scheduled dates - always available for booking`);
        return { success: true };
      }

      // If we reach here, the exam is within the scheduled window
      logger.info(`Exam ${examId} is within scheduled window - available for booking`);
      return { success: true };
    } catch (error) {
      logger.error('Can user book exam check failed', error);
      return { success: false, message: 'Failed to validate booking eligibility' };
    }
  }

  /**
   * Debug method to check exam availability status
   */
  async getExamAvailabilityStatus(examId) {
    try {
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: {
          id: true,
          title: true,
          isActive: true,
          isPublic: true,
          scheduledStart: true,
          scheduledEnd: true,
          allowRetakes: true,
          maxRetakes: true
        }
      });

      if (!exam) {
        return { success: false, message: 'Exam not found' };
      }

      const now = new Date();
      const scheduledStart = exam.scheduledStart ? new Date(exam.scheduledStart) : null;
      const scheduledEnd = exam.scheduledEnd ? new Date(exam.scheduledEnd) : null;

      const availability = {
        examId: exam.id,
        title: exam.title,
        isActive: exam.isActive,
        isPublic: exam.isPublic,
        currentTime: now,
        scheduledStart,
        scheduledEnd,
        allowRetakes: exam.allowRetakes,
        maxRetakes: exam.maxRetakes,
        status: 'UNKNOWN'
      };

      // Determine availability status
      if (!exam.isActive) {
        availability.status = 'INACTIVE';
        availability.reason = 'Exam is not active';
      } else if (!exam.isPublic) {
        availability.status = 'NOT_PUBLIC';
        availability.reason = 'Exam is not public';
      } else if (scheduledStart && now < scheduledStart) {
        availability.status = 'NOT_STARTED';
        availability.reason = `Exam starts on ${scheduledStart.toLocaleDateString()}`;
        availability.timeUntilStart = Math.ceil((scheduledStart - now) / (1000 * 60 * 60 * 24));
      } else if (scheduledEnd && now > scheduledEnd) {
        availability.status = 'ENDED';
        availability.reason = `Exam ended on ${scheduledEnd.toLocaleDateString()}`;
      } else {
        availability.status = 'AVAILABLE';
        availability.reason = 'Exam is available for booking';
      }

      return { success: true, availability };
    } catch (error) {
      logger.error('Get exam availability status failed', error);
      return { success: false, message: 'Failed to get exam availability status' };
    }
  }

  /**
   * Validate scheduling constraints
   */
  async validateScheduling(examId, scheduledAt) {
    try {
      const scheduledDate = new Date(scheduledAt);
      const now = new Date();

      // Check if scheduled time is in the future
      if (scheduledDate <= now) {
        return { success: false, message: 'Scheduled time must be in the future' };
      }

      // Check if scheduled time is within exam window
      const exam = await prisma.exam.findUnique({
        where: { id: examId }
      });

      if (exam.scheduledStart && scheduledDate < exam.scheduledStart) {
        return { success: false, message: 'Scheduled time is before exam start date' };
      }

      if (exam.scheduledEnd && scheduledDate > exam.scheduledEnd) {
        return { success: false, message: 'Scheduled time is after exam end date' };
      }

      // Check for scheduling conflicts (optional - can be implemented based on business rules)
      const conflictingBookings = await prisma.examBooking.findMany({
        where: {
          examId,
          scheduledAt: {
            gte: new Date(scheduledDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            lte: new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
          },
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      });

      if (conflictingBookings.length > 0) {
        return { success: false, message: 'There is a scheduling conflict. Please choose a different time.' };
      }

      return { success: true };
    } catch (error) {
      logger.error('Scheduling validation failed', error);
      return { success: false, message: 'Failed to validate scheduling' };
    }
  }

  /**
   * Get user bookings with pagination and filters
   */
  async getUserBookings(userId, options = {}) {
    const { page = 1, limit = 10, status, examCategoryId } = options;
    const skip = (page - 1) * limit;

    try {
      const where = { userId };

      if (status) {
        where.status = status;
      }

      if (examCategoryId) {
        where.exam = {
          examCategoryId
        };
      }

      const [bookings, total] = await Promise.all([
        prisma.examBooking.findMany({
          where,
          include: {
            exam: {
              include: {
                examCategory: true
              }
            },
            payment: true,
            attempts: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                startedAt: true,
                completedAt: true,
                totalMarks: true,
                obtainedMarks: true,
                percentage: true,
                isPassed: true,
                createdAt: true,
                updatedAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.examBooking.count({ where })
      ]);

      return {
        bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get user bookings failed', error);
      throw error;
    }
  }

  /**
   * Get booking details
   */
  async getBookingDetails(bookingId, userId) {
    try {
      const booking = await prisma.examBooking.findFirst({
        where: {
          id: bookingId,
          userId
        },
        include: {
          exam: {
            include: {
              examCategory: true,
              questions: {
                include: {
                  question: true
                }
              }
            }
          },
          payment: true,
                      attempts: {
              select: {
                id: true,
                status: true,
                startedAt: true,
                completedAt: true,
                totalMarks: true,
                obtainedMarks: true,
                percentage: true,
                isPassed: true,
                createdAt: true,
                updatedAt: true,
                responses: {
                  select: {
                    id: true,
                    selectedOptions: true,
                    isCorrect: true,
                    marksObtained: true,
                    timeSpent: true,
                    answeredAt: true,
                    submittedAt: true,
                    essayAnswer: true,
                    score: true,
                    feedback: true,
                    percentage: true,
                    question: {
                      select: {
                        id: true,
                        text: true,
                        type: true,
                        difficulty: true,
                        marks: true
                      }
                    }
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
        }
      });

      return booking;
    } catch (error) {
      logger.error('Get booking details failed', error);
      throw error;
    }
  }

  /**
   * Update booking
   */
  async updateBooking(bookingId, userId, updateData) {
    try {
      const booking = await prisma.examBooking.findFirst({
        where: {
          id: bookingId,
          userId
        }
      });

      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      if (booking.status !== 'PENDING') {
        return { success: false, message: 'Cannot update booking that is not pending' };
      }

      const updatedBooking = await prisma.examBooking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          exam: {
            include: {
              examCategory: true
            }
          }
        }
      });

      return { success: true, booking: updatedBooking };
    } catch (error) {
      logger.error('Update booking failed', error);
      return { success: false, message: 'Failed to update booking' };
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId, userId, reason) {
    try {
      const booking = await prisma.examBooking.findFirst({
        where: {
          id: bookingId,
          userId
        },
        include: {
          exam: true,
          user: true
        }
      });

      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      if (booking.status === 'CANCELLED') {
        return { success: false, message: 'Booking is already cancelled' };
      }

      if (booking.status === 'COMPLETED') {
        return { success: false, message: 'Cannot cancel completed booking' };
      }

      // Check if there are any active attempts
      const activeAttempts = await prisma.examAttempt.findMany({
        where: {
          bookingId,
          status: { in: ['IN_PROGRESS', 'NOT_STARTED'] }
        }
      });

      if (activeAttempts.length > 0) {
        return { success: false, message: 'Cannot cancel booking with active attempts' };
      }

      const updatedBooking = await prisma.examBooking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          notes: reason ? `${booking.notes || ''}\nCancellation reason: ${reason}` : booking.notes
        },
        include: {
          exam: true,
          user: true
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'EXAM_BOOKING_CANCELLED',
          resource: 'EXAM_BOOKING',
          resourceId: bookingId,
          details: {
            reason,
            cancelledAt: new Date().toISOString()
          },
          ipAddress: 'system',
          userAgent: 'booking-cancellation'
        }
      });

      return { success: true, booking: updatedBooking };
    } catch (error) {
      logger.error('Cancel booking failed', error);
      return { success: false, message: 'Failed to cancel booking' };
    }
  }

  /**
   * Start exam attempt
   */
  async startExamAttempt(bookingId, userId) {
    try {
      const booking = await prisma.examBooking.findFirst({
        where: {
          id: bookingId,
          userId
        },
        include: {
          exam: true
        }
      });

      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      if (booking.status !== 'CONFIRMED') {
        return { success: false, message: 'Booking must be confirmed before starting exam' };
      }

      // Check attempts limit
      if (booking.attemptsUsed >= booking.attemptsAllowed) {
        return { 
          success: false, 
          message: `You have used all ${booking.attemptsAllowed} attempts for this exam. No more attempts allowed.` 
        };
      }

      // Check if there's already an active attempt
      const activeAttempt = await prisma.examAttempt.findFirst({
        where: {
          bookingId,
          status: { in: ['NOT_STARTED', 'IN_PROGRESS'] }
        }
      });

      if (activeAttempt) {
        return { success: false, message: 'You already have an active attempt for this booking' };
      }

      // Create new attempt and increment attempts used
      const [attempt] = await prisma.$transaction([
        prisma.examAttempt.create({
          data: {
            userId,
            examId: booking.examId,
            bookingId,
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            ipAddress: 'system', // Will be set by middleware
            userAgent: 'system'  // Will be set by middleware
          }
        }),
        prisma.examBooking.update({
          where: { id: bookingId },
          data: { attemptsUsed: { increment: 1 } }
        })
      ]);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'EXAM_ATTEMPT_STARTED',
          resource: 'EXAM_ATTEMPT',
          resourceId: attempt.id,
          details: {
            bookingId,
            examId: booking.examId,
            startedAt: attempt.startedAt
          },
          ipAddress: 'system',
          userAgent: 'exam-start'
        }
      });

      // Send exam started notification
      try {
        if (global.notificationService) {
          await global.notificationService.notifyExamStarted({
            id: attempt.id,
            userId,
            examId: booking.examId,
            exam: {
              id: booking.exam.id,
              title: booking.exam.title,
              duration: booking.exam.duration
            }
          });
          logger.info(`🔔 Sent exam started notification to user ${userId}`);
        }
      } catch (notificationError) {
        logger.warn('Failed to send exam started notification:', notificationError);
        // Continue without notification - this is not critical
      }

      return { success: true, attempt, exam: booking.exam, booking };
    } catch (error) {
      logger.error('Start exam attempt failed', error);
      return { success: false, message: 'Failed to start exam attempt' };
    }
  }

  /**
   * Get available exams for user
   */
  async getAvailableExams(userId, options = {}) {
    const { examCategoryId, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    try {
      const where = {
        isActive: true,
        isPublic: true
      };

      if (examCategoryId) {
        where.examCategoryId = examCategoryId;
      }

      // Add scheduling constraints - exams are available if:
      // 1. No scheduled dates are set (always available)
      // 2. Current time is within the scheduled window
      const now = new Date();
      
      // Build the date filtering logic
      where.OR = [
        // No scheduled dates - always available
        {
          AND: [
            { scheduledStart: null },
            { scheduledEnd: null }
          ]
        },
        // Has scheduled start but no end - available after start
        {
          AND: [
            { scheduledStart: { not: null } },
            { scheduledStart: { lte: now } },
            { scheduledEnd: null }
          ]
        },
        // Has scheduled end but no start - available before end
        {
          AND: [
            { scheduledStart: null },
            { scheduledEnd: { not: null } },
            { scheduledEnd: { gte: now } }
          ]
        },
        // Has both start and end - available within window
        {
          AND: [
            { scheduledStart: { not: null } },
            { scheduledStart: { lte: now } },
            { scheduledEnd: { not: null } },
            { scheduledEnd: { gte: now } }
          ]
        }
      ];

      const [exams, total] = await Promise.all([
        prisma.exam.findMany({
          where,
          include: {
            examCategory: true,
            _count: {
              select: {
                attempts: {
                  where: { userId }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.exam.count({ where })
      ]);

      // Filter out exams user can't take based on retake policies
      const availableExams = exams.filter(exam => {
        const canTake = exam.allowRetakes || exam._count.attempts === 0;
        const withinRetakeLimit = exam.allowRetakes ? 
          exam._count.attempts < exam.maxRetakes : 
          exam._count.attempts === 0;
        
        return canTake && withinRetakeLimit;
      });

      return {
        exams: availableExams,
        pagination: {
          page,
          limit,
          total: availableExams.length,
          pages: Math.ceil(availableExams.length / limit),
          hasNext: page * limit < availableExams.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get available exams failed', error);
      throw error;
    }
  }

  /**
   * Get user booking statistics
   */
  async getUserBookingStats(userId) {
    try {
      const [
        totalBookings,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        totalSpent,
        averageScore
      ] = await Promise.all([
        prisma.examBooking.count({ where: { userId } }),
        prisma.examBooking.count({ 
          where: { 
            userId,
            status: 'CONFIRMED'
          }
        }),
        prisma.examBooking.count({ 
          where: { 
            userId,
            status: 'PENDING'
          }
        }),
        prisma.examBooking.count({ 
          where: { 
            userId,
            status: 'CANCELLED'
          }
        }),
        prisma.examBooking.aggregate({
          where: { 
            userId,
            status: 'CONFIRMED'
          },
          _sum: { totalAmount: true }
        }),
        prisma.examAttempt.aggregate({
          where: { 
            userId,
            status: 'COMPLETED'
          },
          _avg: { percentage: true }
        })
      ]);

      return {
        totalBookings,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        totalSpent: totalSpent._sum.totalAmount || 0,
        averageScore: averageScore._avg.percentage || 0,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0
      };
    } catch (error) {
      logger.error('Get user booking stats failed', error);
      throw error;
    }
  }

  /**
   * Admin: Get all bookings
   */
  async getAllBookings(options = {}) {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      examCategoryId, 
      userId, 
      startDate, 
      endDate 
    } = options;
    
    const skip = (page - 1) * limit;

    try {
      const where = {};

      if (status) {
        where.status = status;
      }

      if (examCategoryId) {
        where.exam = { examCategoryId };
      }

      if (userId) {
        where.userId = userId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [bookings, total] = await Promise.all([
        prisma.examBooking.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            exam: {
              include: {
                examCategory: true
              }
            },
            payment: true,
            attempts: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.examBooking.count({ where })
      ]);

      return {
        bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Get all bookings failed', error);
      throw error;
    }
  }

  /**
   * Admin: Update booking status
   */
  async updateBookingStatus(bookingId, status, notes, adminId) {
    try {
      const booking = await prisma.examBooking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          exam: true
        }
      });

      if (!booking) {
        return { success: false, message: 'Booking not found' };
      }

      const updatedBooking = await prisma.examBooking.update({
        where: { id: bookingId },
        data: {
          status,
          notes: notes ? `${booking.notes || ''}\nAdmin note: ${notes}` : booking.notes
        },
        include: {
          user: true,
          exam: true
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'EXAM_BOOKING_STATUS_UPDATED',
          resource: 'EXAM_BOOKING',
          resourceId: bookingId,
          details: {
            oldStatus: booking.status,
            newStatus: status,
            notes,
            updatedAt: new Date().toISOString()
          },
          ipAddress: 'system',
          userAgent: 'admin-update'
        }
      });

      // Send notification to student about status change
      try {
        if (global.notificationService) {
          if (status === 'CONFIRMED' && booking.status !== 'CONFIRMED') {
            // Booking was just confirmed
            await global.notificationService.notifyBookingConfirmed(updatedBooking);
            logger.info(`🔔 Sent booking confirmation notification to user ${booking.userId}`);
          } else if (status === 'CANCELLED' && booking.status !== 'CANCELLED') {
            // Booking was just cancelled
            await global.notificationService.notifyBookingCancelled(updatedBooking, notes);
            logger.info(`🔔 Sent booking cancellation notification to user ${booking.userId}`);
          } else if (status === 'RESCHEDULED' && booking.status !== 'RESCHEDULED') {
            // Booking was rescheduled
            await global.notificationService.sendPersonalNotification(booking.userId, {
              type: 'EXAM_RESCHEDULED',
              title: '📅 Exam Rescheduled',
              message: `Your exam "${updatedBooking.exam.title}" has been rescheduled. Please check your new schedule.`,
              priority: 'high',
              data: {
                bookingId: updatedBooking.id,
                examId: updatedBooking.examId,
                examTitle: updatedBooking.exam.title,
                oldScheduledAt: booking.scheduledAt,
                newScheduledAt: updatedBooking.scheduledAt,
                notes
              }
            });
            logger.info(`🔔 Sent exam reschedule notification to user ${booking.userId}`);
          }
        }
      } catch (notificationError) {
        logger.warn('Failed to send status update notification:', notificationError);
        // Continue without notification - this is not critical
      }

      return { success: true, booking: updatedBooking };
    } catch (error) {
      logger.error('Update booking status failed', error);
      return { success: false, message: 'Failed to update booking status' };
    }
  }

  /**
   * Get booking analytics
   */
  async getBookingAnalytics(options = {}) {
    const { startDate, endDate, examCategoryId } = options;

    try {
      const where = {};

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      if (examCategoryId) {
        where.exam = { examCategoryId };
      }

      const [
        totalBookings,
        totalRevenue,
        bookingsByStatus,
        bookingsByCategory,
        dailyBookings
      ] = await Promise.all([
        prisma.examBooking.count({ where }),
        prisma.examBooking.aggregate({
          where: { ...where, status: 'CONFIRMED' },
          _sum: { totalAmount: true }
        }),
        prisma.examBooking.groupBy({
          by: ['status'],
          where,
          _count: { id: true }
        }),
        prisma.examBooking.groupBy({
          by: ['examCategoryId'],
          where,
          _count: { id: true },
          _sum: { totalAmount: true }
        }),
        prisma.examBooking.groupBy({
          by: ['createdAt'],
          where,
          _count: { id: true },
          _sum: { totalAmount: true }
        })
      ]);

      return {
        totalBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
        bookingsByCategory,
        dailyBookings: dailyBookings.map(item => ({
          date: item.createdAt,
          count: item._count.id,
          revenue: item._sum.totalAmount || 0
        }))
      };
    } catch (error) {
      logger.error('Get booking analytics failed', error);
      throw error;
    }
  }
}

module.exports = ExamBookingService; 