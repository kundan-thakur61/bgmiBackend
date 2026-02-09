const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Withdrawal amount is required'],
    min: [100, 'Minimum withdrawal amount is ₹100']
  },
  method: {
    type: String,
    required: [true, 'Withdrawal method is required'],
    enum: ['upi', 'bank']
  },
  // UPI Details
  upiId: {
    type: String,
    match: [/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID']
  },
  // Bank Details
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'approved', 'completed', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  // Processing info
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  processingNotes: String,
  // Rejection
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,
  // Payment details after completion
  transactionId: String,
  paymentReference: String,
  // Linked transaction
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  // Fees
  platformFee: {
    type: Number,
    default: 0
  },
  tds: {
    type: Number,
    default: 0 // Tax deducted at source
  },
  netAmount: {
    type: Number,
    default: 0  // Will be calculated in pre-validate hook
  },
  // User balance snapshot
  walletBalanceAtRequest: {
    type: Number,
    required: true
  },
  // Request metadata
  ip: String,
  userAgent: String,
  deviceFingerprint: String
}, {
  timestamps: true
});

// Indexes
withdrawalSchema.index({ user: 1, status: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: 1 });
withdrawalSchema.index({ processedBy: 1, status: 1 });

// Pre-validate: Calculate net amount (runs before validation)
withdrawalSchema.pre('validate', function(next) {
  if (this.isNew && this.amount) {
    // Calculate TDS (30% on amounts above 10000 for gaming winnings in India)
    if (this.amount > 10000) {
      this.tds = Math.round(this.amount * 0.30);
    } else {
      this.tds = 0;
    }
    
    // Platform fee (if any)
    this.platformFee = 0;
    
    this.netAmount = this.amount - this.tds - this.platformFee;
  }
  next();
});

// Pre-save: Additional processing if needed
withdrawalSchema.pre('save', function(next) {
  next();
});

// Check if user can request withdrawal
withdrawalSchema.statics.canUserWithdraw = async function(userId) {
  const User = mongoose.model('User');
  const user = await User.findById(userId);
  
  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }
  
  if (user.isBanned) {
    return { allowed: false, reason: 'Account is banned' };
  }
  
  // Check for pending withdrawals
  const pendingWithdrawal = await this.findOne({
    user: userId,
    status: { $in: ['pending', 'processing'] }
  });
  
  if (pendingWithdrawal) {
    return { allowed: false, reason: 'You have a pending withdrawal request' };
  }
  
  // Check 24-hour cooldown
  const lastWithdrawal = await this.findOne({
    user: userId,
    status: 'completed'
  }).sort({ completedAt: -1 });
  
  if (lastWithdrawal) {
    const hoursSinceLastWithdrawal = (Date.now() - lastWithdrawal.processedAt) / (1000 * 60 * 60);
    if (hoursSinceLastWithdrawal < 24) {
      return { 
        allowed: false, 
        reason: `Please wait ${Math.ceil(24 - hoursSinceLastWithdrawal)} hours before next withdrawal` 
      };
    }
  }
  
  return { allowed: true };
};

// Process withdrawal
withdrawalSchema.methods.approve = async function(adminId, notes = '') {
  const User = mongoose.model('User');
  const Transaction = mongoose.model('Transaction');
  
  if (this.status !== 'pending') {
    throw new Error('Only pending withdrawals can be approved');
  }
  
  // Deduct from user wallet
  const transaction = await Transaction.createTransaction({
    user: this.user,
    type: 'debit',
    category: 'withdrawal',
    amount: this.amount,
    description: `Withdrawal request #${this._id} approved`,
    reference: {
      type: 'withdrawal',
      id: this._id
    }
  });
  
  this.status = 'approved';
  this.processedBy = adminId;
  this.processedAt = new Date();
  this.processingNotes = notes;
  this.transaction = transaction._id;
  
  await this.save();
  
  return this;
};

// Complete withdrawal
withdrawalSchema.methods.complete = async function(transactionId, paymentReference) {
  if (this.status !== 'approved') {
    throw new Error('Only approved withdrawals can be completed');
  }
  
  this.status = 'completed';
  this.transactionId = transactionId;
  this.paymentReference = paymentReference;
  
  await this.save();
  
  return this;
};

// Reject withdrawal
withdrawalSchema.methods.reject = async function(adminId, reason) {
  const Transaction = mongoose.model('Transaction');
  
  if (this.status !== 'pending' && this.status !== 'processing') {
    throw new Error('Cannot reject this withdrawal');
  }
  
  // If already deducted, refund
  if (this.transaction) {
    await Transaction.createTransaction({
      user: this.user,
      type: 'credit',
      category: 'withdrawal', // Refund
      amount: this.amount,
      description: `Withdrawal request #${this._id} rejected - refund`,
      reference: {
        type: 'withdrawal',
        id: this._id
      }
    });
  }
  
  this.status = 'rejected';
  this.rejectedBy = adminId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  
  await this.save();
  
  return this;
};

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
