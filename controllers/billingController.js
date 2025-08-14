const billingService = require('../services/billingService');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../config/logger');

class BillingController {
  /**
   * Generate bill for a booking
   */
  async generateBill(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.id;

      const bill = await billingService.getBillByBookingId(bookingId, userId);

      res.status(200).json({
        success: true,
        message: 'Bill generated successfully',
        data: bill
      });
    } catch (error) {
      logger.error('Generate bill error:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to generate bill'
        }
      });
    }
  }

  /**
   * Get user's bills
   */
  async getUserBills(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const bills = await billingService.getUserBills(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      res.status(200).json({
        success: true,
        data: bills
      });
    } catch (error) {
      logger.error('Get user bills error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get bills'
        }
      });
    }
  }

  /**
   * Get all bills (admin only)
   */
  async getAllBills(req, res) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;

      const bills = await billingService.getAllBills({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: bills
      });
    } catch (error) {
      logger.error('Get all bills error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get bills'
        }
      });
    }
  }

  /**
   * Download bill as PDF (placeholder for future implementation)
   */
  async downloadBill(req, res) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.id;

      const bill = await billingService.getBillByBookingId(bookingId, userId);

      // For now, return the bill data as JSON
      // In the future, this could generate a PDF
      res.status(200).json({
        success: true,
        message: 'Bill download ready',
        data: {
          bill,
          downloadUrl: `/api/v1/billing/${bookingId}/pdf` // Placeholder for PDF generation
        }
      });
    } catch (error) {
      logger.error('Download bill error:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to download bill'
        }
      });
    }
  }
}

module.exports = new BillingController(); 