const mongoose = require('mongoose');
const PopularityListing = require('../models/PopularityListing');
const PopularityTransaction = require('../models/PopularityTransaction');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { cloudinary } = require('../config/cloudinary');

// Constants
const BASE_RATE = 4; // 1000 points = Rs. 4
const PLATFORM_FEE_PERCENT = 5;
const MIN_POINTS = 1000;
const MAX_POINTS = 1000000;

// @desc    Get marketplace overview
// @route   GET /api/popularity/overview
// @access  Public
exports.getOverview = async (req, res) => {
  try {
    const stats = await PopularityListing.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          totalPointsAvailable: { $sum: '$remainingPoints' },
          avgPricePerThousand: { $avg: '$pricePerThousand' },
          minPricePerThousand: { $min: '$pricePerThousand' },
          maxPricePerThousand: { $max: '$pricePerThousand' }
        }
      }
    ]);

    const recentTransactions = await PopularityTransaction.find({
      status: 'completed'
    })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate('buyer', 'name')
      .populate('seller', 'name')
      .select('popularityPoints totalAmount completedAt');

    const totalVolume = await PopularityTransaction.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalPointsTraded: { $sum: '$popularityPoints' },
          totalValue: { $sum: '$totalAmount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalListings: 0,
          totalPointsAvailable: 0,
          avgPricePerThousand: BASE_RATE,
          minPricePerThousand: BASE_RATE,
          maxPricePerThousand: BASE_RATE
        },
        recentTransactions,
        totalVolume: totalVolume[0] || {
          totalPointsTraded: 0,
          totalValue: 0,
          totalTransactions: 0
        },
        baseRate: BASE_RATE
      }
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all listings
// @route   GET /api/popularity/listings
// @access  Public
exports.getListings = async (req, res) => {
  try {
    const {
      minPoints,
      maxPoints,
      maxPrice,
      sortBy = 'pricePerThousand',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    const query = {
      status: 'active',
      remainingPoints: { $gt: 0 },
      expiresAt: { $gt: new Date() }
    };

    if (minPoints) query.remainingPoints.$gte = parseInt(minPoints);
    if (maxPoints) query.remainingPoints.$lte = parseInt(maxPoints);
    if (maxPrice) query.pricePerThousand.$lte = parseFloat(maxPrice);

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const listings = await PopularityListing.find(query)
      .populate('seller', 'name avatar level isVerifiedHost')
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await PopularityListing.countDocuments(query);

    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single listing
// @route   GET /api/popularity/listings/:id
// @access  Public
exports.getListing = async (req, res) => {
  try {
    const listing = await PopularityListing.findById(req.params.id)
      .populate('seller', 'name avatar level isVerifiedHost matchesPlayed totalEarnings');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Get seller's recent transactions
    const sellerTransactions = await PopularityTransaction.find({
      seller: listing.seller._id,
      status: 'completed'
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .select('popularityPoints rating');

    res.json({
      success: true,
      data: {
        listing,
        sellerTransactions
      }
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new listing (Sell)
// @route   POST /api/popularity/listings
// @access  Private
exports.createListing = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { characterId, characterName, popularityPoints, pricePerThousand, sellerNotes } = req.body;

    // Validation
    if (!characterId || !characterName || !popularityPoints) {
      return res.status(400).json({
        success: false,
        message: 'Character ID, Character Name, and Popularity Points are required'
      });
    }

    if (popularityPoints < MIN_POINTS || popularityPoints > MAX_POINTS) {
      return res.status(400).json({
        success: false,
        message: `Popularity points must be between ${MIN_POINTS.toLocaleString()} and ${MAX_POINTS.toLocaleString()}`
      });
    }

    // Check for existing active listings
    const existingListing = await PopularityListing.findOne({
      seller: req.user._id,
      status: 'active'
    });

    if (existingListing) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active listing. Please edit or delete it first.'
      });
    }

    const listing = await PopularityListing.create([{
      seller: req.user._id,
      characterId,
      characterName,
      popularityPoints,
      pricePerThousand: pricePerThousand || BASE_RATE,
      sellerNotes
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: listing[0]
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create listing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    session.endSession();
  }
};

// @desc    Update listing
// @route   PUT /api/popularity/listings/:id
// @access  Private
exports.updateListing = async (req, res) => {
  try {
    const { characterId, characterName, popularityPoints, pricePerThousand, status, sellerNotes } = req.body;

    const listing = await PopularityListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Update fields
    if (characterId) listing.characterId = characterId;
    if (characterName) listing.characterName = characterName;
    if (popularityPoints && popularityPoints >= MIN_POINTS && popularityPoints <= MAX_POINTS) {
      listing.popularityPoints = popularityPoints;
      listing.remainingPoints = popularityPoints - listing.totalSold;
    }
    if (pricePerThousand) listing.pricePerThousand = pricePerThousand;
    if (status && ['active', 'paused'].includes(status)) listing.status = status;
    if (sellerNotes !== undefined) listing.sellerNotes = sellerNotes;

    await listing.save();

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: listing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete listing
// @route   DELETE /api/popularity/listings/:id
// @access  Private
exports.deleteListing = async (req, res) => {
  try {
    const listing = await PopularityListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check for pending transactions
    const pendingTransactions = await PopularityTransaction.countDocuments({
      listing: listing._id,
      status: { $in: ['pending', 'payment_done', 'transferred'] }
    });

    if (pendingTransactions > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete listing with pending transactions'
      });
    }

    await listing.remove();

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's listings
// @route   GET /api/popularity/my-listings
// @access  Private
exports.getMyListings = async (req, res) => {
  try {
    const listings = await PopularityListing.find({ seller: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Calculate price for points
// @route   POST /api/popularity/calculate
// @access  Public
exports.calculatePrice = (req, res) => {
  const { points, ratePerThousand = BASE_RATE } = req.body;

  if (!points || points < MIN_POINTS) {
    return res.status(400).json({
      success: false,
      message: `Minimum ${MIN_POINTS.toLocaleString()} points required`
    });
  }

  const totalPrice = Math.ceil((points / 1000) * ratePerThousand);
  const platformFee = Math.ceil(totalPrice * (PLATFORM_FEE_PERCENT / 100));
  const sellerEarnings = totalPrice - platformFee;

  res.json({
    success: true,
    data: {
      points,
      ratePerThousand,
      totalPrice,
      platformFee,
      sellerEarnings,
      breakdown: {
        perThousand: ratePerThousand,
        formula: `(${points.toLocaleString()} / 1000) × ${ratePerThousand} = ${totalPrice}`
      }
    }
  });
};

// @desc    Purchase popularity points (Buy)
// @route   POST /api/popularity/buy
// @access  Private
exports.buyPopularity = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { listingId, points, buyerCharacterId, buyerCharacterName } = req.body;

    if (!listingId || !points || !buyerCharacterId || !buyerCharacterName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (points < MIN_POINTS) {
      return res.status(400).json({
        success: false,
        message: `Minimum ${MIN_POINTS.toLocaleString()} points required`
      });
    }

    // Get listing
    const listing = await PopularityListing.findById(listingId).session(session);
    if (!listing || !listing.isAvailable(points)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient popularity points available'
      });
    }

    // Check if user is trying to buy from themselves
    if (listing.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot purchase from your own listing'
      });
    }

    // Calculate price
    const totalAmount = Math.ceil((points / 1000) * listing.pricePerThousand);

    // Check user balance
    const user = await User.findById(req.user._id).session(session);
    if (user.walletBalance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        required: totalAmount,
        available: user.walletBalance
      });
    }

    // Create transaction
    const transaction = await PopularityTransaction.create([{
      buyer: req.user._id,
      seller: listing.seller,
      listing: listingId,
      popularityPoints: points,
      pricePerThousand: listing.pricePerThousand,
      totalAmount,
      buyerCharacterId,
      buyerCharacterName,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }], { session });

    // Deduct from buyer's wallet
    await Transaction.createTransaction([{
      user: req.user._id,
      type: 'debit',
      category: 'popularity_purchase',
      amount: totalAmount,
      balanceBefore: user.walletBalance,
      balanceAfter: user.walletBalance - totalAmount,
      description: `Purchased ${points.toLocaleString()} popularity points`,
      reference: {
        type: 'popularity_transaction',
        id: transaction[0]._id
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }], { session });

    // Update listing
    await listing.purchasePoints(points);

    // Notify seller
    await Notification.create([{
      user: listing.seller,
      type: 'popularity_sale',
      title: 'New Popularity Sale!',
      message: `${user.name} wants to buy ${points.toLocaleString()} popularity points for Rs.${totalAmount}`,
      data: {
        transactionId: transaction[0]._id,
        listingId: listing._id
      }
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Purchase initiated successfully. Please wait for the seller to transfer popularity.',
      data: {
        transaction: transaction[0],
        instructions: {
          step1: 'Payment has been deducted from your wallet',
          step2: 'Seller will transfer popularity to your character',
          step3: 'Confirm receipt after receiving popularity',
          step4: 'Funds will be released to seller after confirmation'
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Buy popularity error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  } finally {
    session.endSession();
  }
};

// @desc    Confirm popularity transfer (Seller)
// @route   POST /api/popularity/transactions/:id/confirm-transfer
// @access  Private (Seller only)
exports.confirmTransfer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { screenshot, notes } = req.body;

    const transaction = await PopularityTransaction.findById(req.params.id).session(session);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (transaction.status !== 'payment_done') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not ready for transfer confirmation'
      });
    }

    // Update transaction
    transaction.status = 'transferred';
    transaction.transferAt = new Date();
    if (screenshot) {
      transaction.transferProof.screenshot = screenshot;
    }
    if (notes) {
      transaction.transferProof.notes = notes;
    }
    transaction.transferProof.transferredAt = new Date();

    await transaction.save();

    // Notify buyer
    await Notification.create([{
      user: transaction.buyer,
      type: 'popularity_transfer',
      title: 'Popularity Transferred!',
      message: `Seller has transferred ${transaction.popularityPoints.toLocaleString()} popularity points. Please confirm receipt.`,
      data: {
        transactionId: transaction._id
      }
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Transfer confirmed. Waiting for buyer confirmation.',
      data: transaction
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Confirm transfer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    session.endSession();
  }
};

// @desc    Confirm receipt (Buyer)
// @route   POST /api/popularity/transactions/:id/confirm-receipt
// @access  Private (Buyer only)
exports.confirmReceipt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await PopularityTransaction.findById(req.params.id).session(session);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (transaction.status !== 'transferred') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not ready for receipt confirmation'
      });
    }

    // Update transaction
    transaction.status = 'completed';
    transaction.completedAt = new Date();

    await transaction.save();

    // Credit seller's wallet
    const seller = await User.findById(transaction.seller).session(session);
    await Transaction.createTransaction([{
      user: seller._id,
      type: 'credit',
      category: 'popularity_sale',
      amount: transaction.sellerEarnings,
      balanceBefore: seller.walletBalance,
      balanceAfter: seller.walletBalance + transaction.sellerEarnings,
      description: `Sold ${transaction.popularityPoints.toLocaleString()} popularity points`,
      reference: {
        type: 'popularity_transaction',
        id: transaction._id
      }
    }], { session });

    // Notify seller
    await Notification.create([{
      user: transaction.seller,
      type: 'popularity_completed',
      title: 'Transaction Completed!',
      message: `You earned Rs.${transaction.sellerEarnings} from selling ${transaction.popularityPoints.toLocaleString()} popularity points.`,
      data: {
        transactionId: transaction._id
      }
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Transaction completed successfully!',
      data: transaction
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Confirm receipt error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    session.endSession();
  }
};

// @desc    Cancel transaction
// @route   POST /api/popularity/transactions/:id/cancel
// @access  Private
exports.cancelTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;

    const transaction = await PopularityTransaction.findById(req.params.id).session(session);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Check authorization
    const isBuyer = transaction.buyer.toString() === req.user._id.toString();
    const isSeller = transaction.seller.toString() === req.user._id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['pending', 'payment_done'].includes(transaction.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel transaction at this stage'
      });
    }

    // Update transaction
    transaction.status = 'cancelled';
    transaction.cancellation = {
      reason,
      cancelledBy: req.user._id,
      cancelledAt: new Date()
    };

    await transaction.save();

    // Refund buyer if payment was made
    if (transaction.status === 'payment_done' || isSeller) {
      const buyer = await User.findById(transaction.buyer).session(session);
      await Transaction.createTransaction([{
        user: buyer._id,
        type: 'credit',
        category: 'popularity_refund',
        amount: transaction.totalAmount,
        balanceBefore: buyer.walletBalance,
        balanceAfter: buyer.walletBalance + transaction.totalAmount,
        description: `Refund for cancelled popularity purchase`,
        reference: {
          type: 'popularity_transaction',
          id: transaction._id
        }
      }], { session });

      // Restore listing points
      const listing = await PopularityListing.findById(transaction.listing).session(session);
      listing.remainingPoints += transaction.popularityPoints;
      if (listing.status === 'sold_out') {
        listing.status = 'active';
      }
      await listing.save();
    }

    // Notify other party
    const notifyUser = isBuyer ? transaction.seller : transaction.buyer;
    await Notification.create([{
      user: notifyUser,
      type: 'popularity_cancelled',
      title: 'Transaction Cancelled',
      message: `The popularity transaction has been cancelled. Reason: ${reason || 'Not specified'}`,
      data: {
        transactionId: transaction._id
      }
    }], { session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Transaction cancelled successfully',
      data: transaction
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Cancel transaction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    session.endSession();
  }
};

// @desc    Raise dispute
// @route   POST /api/popularity/transactions/:id/dispute
// @access  Private (Buyer only)
exports.raiseDispute = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Dispute reason is required' });
    }

    const transaction = await PopularityTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (transaction.status !== 'transferred') {
      return res.status(400).json({
        success: false,
        message: 'Can only dispute after transfer'
      });
    }

    transaction.status = 'disputed';
    transaction.dispute = {
      reason,
      raisedAt: new Date()
    };

    await transaction.save();

    // Notify admin
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
    await Notification.insertMany(admins.map(admin => ({
      user: admin._id,
      type: 'popularity_dispute',
      title: 'New Dispute Raised',
      message: `Dispute raised for popularity transaction ${transaction._id}`,
      data: {
        transactionId: transaction._id
      }
    })));

    res.json({
      success: true,
      message: 'Dispute raised. Admin will review and resolve.',
      data: transaction
    });
  } catch (error) {
    console.error('Raise dispute error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user's transactions
// @route   GET /api/popularity/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const { role = 'all', status, page = 1, limit = 20 } = req.query;

    const transactions = await PopularityTransaction.getUserTransactions(
      req.user._id,
      role,
      { status, page: parseInt(page), limit: parseInt(limit) }
    );

    const total = await PopularityTransaction.countDocuments({
      ...(role === 'buyer' ? { buyer: req.user._id } :
          role === 'seller' ? { seller: req.user._id } :
          { $or: [{ buyer: req.user._id }, { seller: req.user._id }] }),
      ...(status && { status })
    });

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single transaction
// @route   GET /api/popularity/transactions/:id
// @access  Private
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await PopularityTransaction.findById(req.params.id)
      .populate('buyer', 'name avatar email')
      .populate('seller', 'name avatar email')
      .populate('listing', 'characterId characterName');

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Check authorization
    const isBuyer = transaction.buyer._id.toString() === req.user._id.toString();
    const isSeller = transaction.seller._id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Rate transaction
// @route   POST /api/popularity/transactions/:id/rate
// @access  Private (Buyer only)
exports.rateTransaction = async (req, res) => {
  try {
    const { score, review } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Rating score (1-5) is required' });
    }

    const transaction = await PopularityTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed transactions'
      });
    }

    if (transaction.rating && transaction.rating.score) {
      return res.status(400).json({
        success: false,
        message: 'Transaction already rated'
      });
    }

    transaction.rating = {
      score,
      review,
      ratedAt: new Date()
    };

    await transaction.save();

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: transaction.rating
    });
  } catch (error) {
    console.error('Rate transaction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Mark payment as done (internal - called after payment)
// @route   POST /api/popularity/transactions/:id/payment-done
// @access  Private
exports.markPaymentDone = async (req, res) => {
  try {
    const transaction = await PopularityTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Transaction is not in pending state'
      });
    }

    transaction.status = 'payment_done';
    transaction.paymentAt = new Date();

    await transaction.save();

    // Notify seller
    await Notification.create({
      user: transaction.seller,
      type: 'popularity_payment',
      title: 'Payment Received!',
      message: `Payment received for ${transaction.popularityPoints.toLocaleString()} popularity points. Please transfer now.`,
      data: {
        transactionId: transaction._id
      }
    });

    res.json({
      success: true,
      message: 'Payment confirmed. Seller will transfer popularity shortly.',
      data: transaction
    });
  } catch (error) {
    console.error('Mark payment done error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};