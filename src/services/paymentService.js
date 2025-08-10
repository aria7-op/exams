const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../config/logger');

class PaymentService {
  /**
   * Create a new payment
   */
  async createPayment(paymentData) {
    try {
      const { userId, bookingId, amount, currency, paymentMethod, description } = paymentData;

      // Validate booking if provided
      if (bookingId) {
        const booking = await prisma.examBooking.findUnique({
          where: { id: bookingId, userId }
        });
        
        if (!booking) {
          throw new Error('Booking not found or access denied');
        }
      }

      const payment = await prisma.payment.create({
        data: {
          userId,
          bookingId,
          amount,
          currency,
          paymentMethod,
          description,
          status: 'PENDING'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          booking: {
            include: {
              exam: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      });

      logger.info(`Payment created: ${payment.id} for user: ${userId}`);
      return payment;
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId, userId) {
    try {
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          userId
        },
        include: {
          booking: {
            include: {
              exam: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      return payment;
    } catch (error) {
      logger.error('Error getting payment:', error);
      throw error;
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const skip = (page - 1) * limit;

      const where = { userId };
      if (status) {
        where.status = status;
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            booking: {
              include: {
                exam: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting user payments:', error);
      throw error;
    }
  }

  /**
   * Process payment (update status)
   */
  async processPayment(paymentId, status, metadata = {}) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status,
          metadata: {
            ...payment.metadata,
            ...metadata,
            processedAt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          booking: {
            include: {
              exam: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        }
      });

      logger.info(`Payment processed: ${paymentId} with status: ${status}`);
      
      // Send payment notification
      if (global.notificationService && updatedPayment.userId) {
        if (status === 'COMPLETED') {
          await global.notificationService.notifyPaymentSuccess(updatedPayment);
        } else if (status === 'FAILED') {
          await global.notificationService.notifyPaymentFailed(updatedPayment);
        }
      }
      
      return updatedPayment;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId, amount, reason) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Payment must be completed to be refunded');
      }

      const refundAmount = amount || payment.amount;

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          metadata: {
            ...payment.metadata,
            refundAmount,
            refundReason: reason,
            refundedAt: new Date()
          }
        }
      });

      logger.info(`Payment refunded: ${paymentId} for amount: ${refundAmount}`);
      return updatedPayment;
    } catch (error) {
      logger.error('Error refunding payment:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(options = {}) {
    try {
      const { startDate, endDate, groupBy = 'day' } = options;

      const where = {};
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      // Get basic statistics
      const [
        totalPayments,
        totalRevenue,
        completedPayments,
        pendingPayments,
        failedPayments
      ] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.payment.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.payment.count({ where: { ...where, status: 'PENDING' } }),
        prisma.payment.count({ where: { ...where, status: 'FAILED' } })
      ]);

      // Get revenue by date
      const revenueByDate = await prisma.payment.groupBy({
        by: ['createdAt'],
        where: { ...where, status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
        orderBy: { createdAt: 'asc' }
      });

      // Get payments by method
      const paymentsByMethod = await prisma.payment.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { amount: true },
        _count: true
      });

      return {
        overview: {
          totalPayments,
          totalRevenue: totalRevenue._sum.amount || 0,
          completedPayments,
          pendingPayments,
          failedPayments,
          successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0
        },
        revenueByDate,
        paymentsByMethod
      };
    } catch (error) {
      logger.error('Error getting payment statistics:', error);
      throw error;
    }
  }

  /**
   * Get all payments (admin only)
   */
  async getAllPayments(options = {}) {
    try {
      const { page = 1, limit = 10, status, paymentMethod, startDate, endDate } = options;
      const skip = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (paymentMethod) where.paymentMethod = paymentMethod;
      if (startDate && endDate) {
        where.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            booking: {
              include: {
                exam: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        }),
        prisma.payment.count({ where })
      ]);

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all payments:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService(); 