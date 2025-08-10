const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, authorize } = require('../middleware/auth');

// Create payment for exam booking
router.post('/', auth, paymentController.createPayment);

// Process payment (simulate payment processing)
router.post('/:paymentId/process', auth, paymentController.processPayment);

// Get payment details
router.get('/:paymentId', auth, paymentController.getPayment);

// Get user's payment history
router.get('/user/history', auth, paymentController.getUserPayments);

// Refund payment
router.post('/:paymentId/refund', auth, paymentController.refundPayment);

// Get payment statistics (admin only)
router.get('/stats/analytics', auth, authorize(['SUPER_ADMIN', 'ADMIN']), paymentController.getPaymentStats);

// Process payment when bill is printed (user or admin)
router.post('/admin/process-on-print/:bookingId', auth, paymentController.processPaymentOnPrint);

module.exports = router; 