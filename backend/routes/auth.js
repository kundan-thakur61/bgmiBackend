const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, optionalAuth } = require('../middleware/auth');
const { validationChains } = require('../middleware/validators');

// Send OTP
router.post('/send-otp', validationChains.sendOtp, authController.sendOtp);

// Verify OTP and Login
router.post('/verify-otp', validationChains.verifyOtp, authController.verifyOtp);

// Register new user
router.post('/register', validationChains.register, authController.register);

// Google OAuth
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Refresh token
router.post('/refresh-token', auth, authController.refreshToken);

// Logout
router.post('/logout', auth, authController.logout);

// Get current user
router.get('/me', auth, authController.getMe);

// Verify referral code
router.get('/verify-referral/:code', authController.verifyReferralCode);

// Check if phone exists
router.get('/check-phone/:phone', authController.checkPhone);

module.exports = router;
