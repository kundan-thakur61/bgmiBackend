const express = require('express');
const router = express.Router();
const savedPaymentMethodController = require('../controllers/savedPaymentMethodController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all saved payment methods
router.get('/', savedPaymentMethodController.getSavedPaymentMethods);

// Get a single payment method
router.get('/:id', savedPaymentMethodController.getSavedPaymentMethod);

// Create a new payment method
router.post('/', savedPaymentMethodController.createSavedPaymentMethod);

// Update a payment method (nickname, default status)
router.put('/:id', savedPaymentMethodController.updateSavedPaymentMethod);

// Delete a payment method
router.delete('/:id', savedPaymentMethodController.deleteSavedPaymentMethod);

// Set a payment method as default
router.post('/:id/set-default', savedPaymentMethodController.setDefaultPaymentMethod);

// Get full payment method details for withdrawal
router.get('/:id/withdrawal-details', savedPaymentMethodController.getPaymentMethodForWithdrawal);

module.exports = router;
