const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { auth, authorize } = require('../middleware/auth');

// Generate bill for a booking
router.get('/:bookingId', auth, billingController.generateBill);

// Get user's bills
router.get('/user/bills', auth, billingController.getUserBills);

// Get all bills (admin only)
router.get('/admin/all', auth, authorize(['SUPER_ADMIN', 'ADMIN']), billingController.getAllBills);

// Download bill
router.get('/:bookingId/download', auth, billingController.downloadBill);

module.exports = router; 