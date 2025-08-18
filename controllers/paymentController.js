const { PrismaClient } = require('@prisma/client');
const paymentService = require('../services/paymentService');
const examBookingService = require('../services/examBookingService');
const { validatePayment } = require('../validators/paymentValidator');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../config/logger');
const notificationService = require('../services/notificationService');

const prisma = new PrismaClient();

class PaymentController {
  /**
   * Create a payment for exam booking
   */
  async createPayment(req, res) {
    try {
      const { error, value } = validatePayment(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: error.details
          }
        });
      }

      const { bookingId, paymentMethod, description } = value;
      const userId = req.user.id;

      // Get booking details
      const booking = await prisma.examBooking.findFirst({
        where: { id: bookingId, userId },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              price: true,
              currency: true
            }
          }
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Booking not found or access denied'
          }
        });
      }

      // Check if payment already exists
      const existingPayment = await prisma.payment.findFirst({
        where: { bookingId, userId }
      });

      if (existingPayment) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Payment already exists for this booking'
          }
        });
      }

      // Create payment
      const payment = await paymentService.createPayment({
        userId,
        bookingId,
        amount: booking.exam.price,
        currency: booking.exam.currency,
        paymentMethod,
        description: description || `Payment for ${booking.exam.title}`
      });

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: {
          payment: {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            createdAt: payment.createdAt
          },
          exam: {
            id: booking.exam.id,
            title: booking.exam.title
          }
        }
      });
    } catch (error) {
      logger.error('Create payment error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create payment'
        }
      });
    }
  }

  /**
   * Process payment (simulate payment processing)
   */
  async processPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      const payment = await paymentService.getPayment(paymentId, userId);
      
      // Simulate payment processing
      const processedPayment = await paymentService.processPayment(paymentId, 'COMPLETED', {
        processedAt: new Date(),
        method: payment.paymentMethod
      });

      // Update booking status
      await prisma.examBooking.update({
        where: { id: payment.bookingId },
        data: { 
          status: 'CONFIRMED',
          paymentId: paymentId
        }
      });

      // Admin/moderator notification for payment processed
      try {
        if (global.notificationService) {
          await global.notificationService.notifyAdminsPaymentProcessed({
            id: processedPayment.id,
            userId,
            amount: processedPayment.amount,
            totalAmount: processedPayment.amount,
            currency: processedPayment.currency
          });
        }
      } catch (e) {
        logger.warn('Failed to notify admins for payment processed', e);
      }

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment: {
            id: processedPayment.id,
            status: processedPayment.status,
            amount: processedPayment.amount,
            currency: processedPayment.currency
          }
        }
      });
    } catch (error) {
      logger.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to process payment'
        }
      });
    }
  }

  /**
   * Process payment when bill is printed (user or admin action)
   */
  async processPaymentOnPrint(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.id;

      // Get booking details
      const booking = await prisma.examBooking.findUnique({
        where: { id: bookingId },
        include: {
          exam: true,
          user: true,
          payment: true
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Booking not found'
          }
        });
      }

      // Check if payment already exists
      if (booking.payment) {
        // If payment exists, generate updated bill and return it
        const billingService = require('../services/billingService');
        const updatedBill = await billingService.generateBill(bookingId);
        
        return res.status(200).json({
          success: true,
          message: 'Payment already exists for this booking',
          data: {
            payment: booking.payment,
            booking: {
              id: booking.id,
              status: booking.status
            },
            bill: updatedBill
          }
        });
      }

      // Check if user can process this payment (booking owner or admin)
      const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
      const isBookingOwner = booking.userId === userId;
      
      if (!isAdmin && !isBookingOwner) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Access denied. You can only process payments for your own bookings.'
          }
        });
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: booking.userId,
          bookingId: booking.id,
          amount: booking.totalAmount,
          currency: booking.currency,
          status: 'COMPLETED',
          paymentMethod: 'CASH', // Since it's printed bill, assume cash payment
          description: `Payment for ${booking.exam.title}`,
          metadata: {
            processedBy: userId,
            processedAt: new Date().toISOString(),
            method: 'BILL_PRINT',
            processedByRole: req.user.role
          }
        }
      });

      // Update booking status to CONFIRMED (paid)
      await prisma.examBooking.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          paymentId: payment.id
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'PAYMENT_PROCESSED_ON_PRINT',
          resource: 'PAYMENT',
          resourceId: payment.id,
          details: {
            bookingId: booking.id,
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            targetUserId: booking.userId,
            processedByRole: req.user.role
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Send notification to user
      await notificationService.sendPaymentConfirmation(booking.user.email, {
        bookingId: booking.id,
        examTitle: booking.exam.title,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        firstName: booking.user.firstName
      });

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment,
          booking: {
            id: booking.id,
            status: 'CONFIRMED'
          }
        }
      });
    } catch (error) {
      logger.error('Process payment on print failed', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to process payment'
        }
      });
    }
  }

  /**
   * Get payment details
   */
  async getPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.id;

      const payment = await paymentService.getPayment(paymentId, userId);

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      logger.error('Get payment error:', error);
      res.status(404).json({
        success: false,
        error: {
          message: 'Payment not found'
        }
      });
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const payments = await paymentService.getUserPayments(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      logger.error('Get user payments error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get payment history'
        }
      });
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;
      const userId = req.user.id;

      const refund = await paymentService.refundPayment(paymentId, amount, reason);

      res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: refund
      });
    } catch (error) {
      logger.error('Refund payment error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to refund payment'
        }
      });
    }
  }

  /**
   * Get payment statistics (admin only)
   */
  async getPaymentStats(req, res) {
    try {
      const { startDate, endDate, paymentMethod } = req.query;

      const stats = await paymentService.getPaymentStatistics({
        startDate,
        endDate,
        paymentMethod
      });

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Get payment stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get payment statistics'
        }
      });
    }
  }
}

module.exports = new PaymentController(); 