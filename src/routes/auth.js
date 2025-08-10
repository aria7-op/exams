const express = require('express');
const authController = require('../controllers/authController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/login', authController.login);
router.post('/logout', auth, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/change-password', auth, authController.changePassword);

// Admin only routes
router.post('/register', auth, adminOnly, authController.register);

module.exports = router; 