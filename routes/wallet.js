const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { auth } = require('../middleware/auth');

// Get wallet balance
router.get('/balance', auth, walletController.getBalance);

// Get transaction history
router.get('/transactions', auth, walletController.getTransactions);

// Create deposit order
router.post('/deposit', auth, walletController.createDeposit);

// Verify payment
router.post('/verify-payment', auth, walletController.verifyPayment);

// Razorpay webhook
router.post('/webhook/razorpay', walletController.razorpayWebhook);

module.exports = router;
