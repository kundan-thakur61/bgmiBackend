const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['credit', 'debit'],
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'deposit',           // Money added to wallet
      'withdrawal',        // Money withdrawn
      'match_entry',       // Entry fee deducted
      'match_prize',       // Prize money credited
      'match_refund',      // Refund for cancelled match
      'match_auto_refund', // Auto-refund for expired challenges
      'match_creation',    // Legacy: Match creation
      'match_creation_fee', // Challenge creation fee (10%)
      'prize_pool_escrow', // Prize pool held for challenge
      'challenge_entry',   // Entry fee for accepting challenge
      'tournament_entry',  // Tournament entry fee
      'tournament_prize',  // Tournament prize
      'tournament_refund', // Tournament refund
      'referral_bonus',    // Referral earnings
      'bonus',             // Promotional bonus
      'admin_credit',      // Admin credited
      'admin_debit',       // Admin debited
      'penalty'            // Penalty for rule violation
    ],
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  // Reference to related entity
  reference: {
    type: {
      type: String,
      enum: ['match', 'tournament', 'withdrawal', 'deposit', 'referral', 'admin']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  // Payment gateway details (for deposits)
  paymentDetails: {
    gateway: {
      type: String,
      enum: ['razorpay', 'cashfree', 'paytm', 'manual']
    },
    orderId: String,
    paymentId: String,
    signature: String,
    method: String, // upi, card, netbanking
    bank: String,
    vpa: String // UPI ID
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'reversed'],
    default: 'completed',
    index: true
  },
  // Admin action
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: String,
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  // IP and device for security
  ip: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes (status already indexed via index: true in schema)
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, category: 1, createdAt: -1 });
transactionSchema.index({ 'reference.type': 1, 'reference.id': 1 });
transactionSchema.index({ 'paymentDetails.orderId': 1 });
transactionSchema.index({ 'paymentDetails.paymentId': 1 });

// Static method to create transaction
transactionSchema.statics.createTransaction = async function (data) {
  const User = mongoose.model('User');
  const user = await User.findById(data.user);

  if (!user) {
    throw new Error('User not found');
  }

  const balanceBefore = user.walletBalance;
  let balanceAfter;

  if (data.type === 'credit') {
    balanceAfter = balanceBefore + data.amount;
  } else {
    if (balanceBefore < data.amount) {
      throw new Error('Insufficient balance');
    }
    balanceAfter = balanceBefore - data.amount;
  }

  // Create transaction
  const transaction = await this.create({
    ...data,
    balanceBefore,
    balanceAfter
  });

  // Update user balance
  user.walletBalance = balanceAfter;
  await user.save();

  return transaction;
};

// Get user's transaction history
transactionSchema.statics.getUserHistory = function (userId, options = {}) {
  const { page = 1, limit = 20, type, category, startDate, endDate } = options;

  const query = { user: userId };

  if (type) query.type = type;
  if (category) query.category = category;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Get daily summary
transactionSchema.statics.getDailySummary = function (date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: { type: '$type', category: '$category' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
