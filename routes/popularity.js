const express = require('express');
const router = express.Router();
const popularityController = require('../controllers/popularityController');
const { auth: protect, optionalAuth } = require('../middleware/auth');

// ============ PUBLIC ROUTES ============

// @route   GET /api/popularity/overview
// @desc    Get marketplace overview
// @access  Public
router.get('/overview', popularityController.getOverview);

// @route   GET /api/popularity/listings
// @desc    Get all listings
// @access  Public
router.get('/listings', popularityController.getListings);

// @route   GET /api/popularity/listings/:id
// @desc    Get single listing
// @access  Public
router.get('/listings/:id', popularityController.getListing);

// @route   POST /api/popularity/calculate
// @desc    Calculate price for points
// @access  Public
router.post('/calculate', popularityController.calculatePrice);

// ============ PROTECTED ROUTES ============

// @route   GET /api/popularity/my-listings
// @desc    Get user's listings
// @access  Private
router.get('/my-listings', protect, popularityController.getMyListings);

// @route   POST /api/popularity/listings
// @desc    Create a new listing (Sell)
// @access  Private
router.post('/listings', protect, popularityController.createListing);

// @route   PUT /api/popularity/listings/:id
// @desc    Update listing
// @access  Private
router.put('/listings/:id', protect, popularityController.updateListing);

// @route   DELETE /api/popularity/listings/:id
// @desc    Delete listing
// @access  Private
router.delete('/listings/:id', protect, popularityController.deleteListing);

// ============ TRANSACTION ROUTES ============

// @route   GET /api/popularity/transactions
// @desc    Get user's transactions
// @access  Private
router.get('/transactions', protect, popularityController.getTransactions);

// @route   GET /api/popularity/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/transactions/:id', protect, popularityController.getTransaction);

// @route   POST /api/popularity/buy
// @desc    Purchase popularity points (Buy)
// @access  Private
router.post('/buy', protect, popularityController.buyPopularity);

// @route   POST /api/popularity/transactions/:id/payment-done
// @desc    Mark payment as done
// @access  Private
router.post('/transactions/:id/payment-done', protect, popularityController.markPaymentDone);

// @route   POST /api/popularity/transactions/:id/confirm-transfer
// @desc    Confirm popularity transfer (Seller)
// @access  Private
router.post('/transactions/:id/confirm-transfer', protect, popularityController.confirmTransfer);

// @route   POST /api/popularity/transactions/:id/confirm-receipt
// @desc    Confirm receipt (Buyer)
// @access  Private
router.post('/transactions/:id/confirm-receipt', protect, popularityController.confirmReceipt);

// @route   POST /api/popularity/transactions/:id/cancel
// @desc    Cancel transaction
// @access  Private
router.post('/transactions/:id/cancel', protect, popularityController.cancelTransaction);

// @route   POST /api/popularity/transactions/:id/dispute
// @desc    Raise dispute
// @access  Private
router.post('/transactions/:id/dispute', protect, popularityController.raiseDispute);

// @route   POST /api/popularity/transactions/:id/rate
// @desc    Rate transaction
// @access  Private
router.post('/transactions/:id/rate', protect, popularityController.rateTransaction);

module.exports = router;