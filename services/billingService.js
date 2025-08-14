const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

class BillingService {
  /**
   * Generate a bill for an exam booking
   */
  async generateBill(bookingId) {
    try {
      const booking = await prisma.examBooking.findUnique({
        where: { id: bookingId },
        include: {
          exam: {
            include: {
              examCategory: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          payment: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const billNumber = `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const billDate = new Date();
      const dueDate = new Date(billDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      const bill = {
        billNumber,
        billDate,
        dueDate,
        booking: {
          id: booking.id,
          scheduledAt: booking.scheduledAt,
          status: booking.status
        },
        exam: {
          id: booking.exam.id,
          title: booking.exam.title,
          description: booking.exam.description,
          category: booking.exam.examCategory.name,
          duration: booking.exam.duration,
          totalMarks: booking.exam.totalMarks
        },
        customer: {
          id: booking.user.id,
          name: `${booking.user.firstName} ${booking.user.lastName}`,
          email: booking.user.email
        },
        amount: {
          subtotal: booking.totalAmount,
          tax: 0, // No tax for now
          total: booking.totalAmount,
          currency: booking.currency
        },
        payment: booking.payment ? {
          id: booking.payment.id,
          status: booking.payment.status,
          method: booking.payment.paymentMethod,
          paidAt: booking.payment.updatedAt
        } : null,
        status: booking.payment ? 'PAID' : 'PENDING'
      };

      logger.info(`Bill generated for booking ${bookingId}: ${billNumber}`);
      return bill;
    } catch (error) {
      logger.error('Error generating bill:', error);
      throw error;
    }
  }

  /**
   * Get bill by booking ID
   */
  async getBillByBookingId(bookingId, userId) {
    try {
      const booking = await prisma.examBooking.findFirst({
        where: { 
          id: bookingId,
          userId 
        },
        include: {
          exam: {
            include: {
              examCategory: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          payment: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found or access denied');
      }

      return this.generateBill(bookingId);
    } catch (error) {
      logger.error('Error getting bill:', error);
      throw error;
    }
  }

  /**
   * Get all bills for a user
   */
  async getUserBills(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const skip = (page - 1) * limit;

      const where = { userId };
      if (status) {
        where.payment = {
          status: status
        };
      }

      const bookings = await prisma.examBooking.findMany({
        where,
        include: {
          exam: {
            include: {
              examCategory: true
            }
          },
          payment: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const bills = await Promise.all(
        bookings.map(booking => this.generateBill(booking.id))
      );

      return {
        bills,
        pagination: {
          page,
          limit,
          total: bookings.length
        }
      };
    } catch (error) {
      logger.error('Error getting user bills:', error);
      throw error;
    }
  }

  /**
   * Get all bills (admin only)
   */
  async getAllBills(options = {}) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      const where = {};
      if (status) {
        where.payment = {
          status: status
        };
      }
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const bookings = await prisma.examBooking.findMany({
        where,
        include: {
          exam: {
            include: {
              examCategory: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          payment: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const bills = await Promise.all(
        bookings.map(booking => this.generateBill(booking.id))
      );

      return {
        bills,
        pagination: {
          page,
          limit,
          total: bookings.length
        }
      };
    } catch (error) {
      logger.error('Error getting all bills:', error);
      throw error;
    }
  }
}

module.exports = new BillingService(); 