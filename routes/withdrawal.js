const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { auth, kycVerified, financeAccess } = require('../middleware/auth');
const { validationChains } = require('../middleware/validators');

// User routes
router.get('/', auth, withdrawalController.getWithdrawals);
router.post('/', auth, kycVerified, validationChains.createWithdrawal, withdrawalController.createWithdrawal);
router.delete('/:id', auth, withdrawalController.cancelWithdrawal);
router.get('/check-eligibility', auth, withdrawalController.checkEligibility);

// Admin routes
router.get('/pending', auth, financeAccess, withdrawalController.getPendingWithdrawals);
router.post('/:id/approve', auth, financeAccess, withdrawalController.approveWithdrawal);
router.post('/:id/complete', auth, financeAccess, withdrawalController.completeWithdrawal);
router.post('/:id/reject', auth, financeAccess, withdrawalController.rejectWithdrawal);

module.exports = router;
