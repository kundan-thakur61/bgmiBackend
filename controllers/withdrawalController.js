const { Withdrawal, User, Transaction, Notification, AdminLog, SavedPaymentMethod } = require('../models');
const { BadRequestError, NotFoundError } = require('../middleware/errorHandler');

// Get user's withdrawals
exports.getWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { user: req.userId };
    if (status) query.status = status;
    
    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Withdrawal.countDocuments(query);
    
    res.json({
      success: true,
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create withdrawal request
exports.createWithdrawal = async (req, res, next) => {
  try {
    const { amount, method, upiId, bankDetails, savedPaymentMethodId, savePaymentMethod } = req.body;
    
    // Check eligibility
    const eligibility = await Withdrawal.canUserWithdraw(req.userId);
    if (!eligibility.allowed) {
      throw new BadRequestError(eligibility.reason);
    }
    
    // Check balance
    const user = await User.findById(req.userId);
    if (user.walletBalance < amount) {
      throw new BadRequestError('Insufficient wallet balance');
    }
    
    let withdrawalMethod = method;
    let withdrawalUpiId = upiId;
    let withdrawalBankDetails = bankDetails;
    let savedMethod = null;
    
    // If using a saved payment method, fetch and validate it
    if (savedPaymentMethodId) {
      savedMethod = await SavedPaymentMethod.findOne({
        _id: savedPaymentMethodId,
        user: req.userId
      });
      
      if (!savedMethod) {
        throw new NotFoundError('Saved payment method not found');
      }
      
      withdrawalMethod = savedMethod.method;
      withdrawalUpiId = savedMethod.upiId;
      withdrawalBankDetails = savedMethod.bankDetails;
      
      // Mark the saved method as used
      await savedMethod.markAsUsed();
    } else {
      // Validate method-specific details for new payment method
      if (method === 'upi' && !upiId) {
        throw new BadRequestError('UPI ID is required for UPI withdrawal');
      }
      
      if (method === 'bank') {
        if (!bankDetails?.accountNumber || !bankDetails?.ifscCode || !bankDetails?.accountHolderName) {
          throw new BadRequestError('Complete bank details are required');
        }
      }
      
      // Optionally save the payment method for future use
      if (savePaymentMethod) {
        try {
          // Check if this payment method already exists
          const existingMethod = method === 'upi' 
            ? await SavedPaymentMethod.findOne({ user: req.userId, method: 'upi', upiId: upiId.toLowerCase() })
            : await SavedPaymentMethod.findOne({ user: req.userId, method: 'bank', 'bankDetails.accountNumber': bankDetails.accountNumber });
          
          if (!existingMethod) {
            // Create new saved payment method
            await SavedPaymentMethod.create({
              user: req.userId,
              method,
              upiId: method === 'upi' ? upiId.toLowerCase() : undefined,
              bankDetails: method === 'bank' ? {
                accountHolderName: bankDetails.accountHolderName,
                accountNumber: bankDetails.accountNumber,
                ifscCode: bankDetails.ifscCode.toUpperCase(),
                bankName: bankDetails.bankName
              } : undefined
            });
          }
        } catch (saveError) {
          // Log but don't fail the withdrawal if saving fails
          console.error('Failed to save payment method:', saveError);
        }
      }
    }
    
    // Create withdrawal
    const withdrawal = await Withdrawal.create({
      user: req.userId,
      amount,
      method: withdrawalMethod,
      upiId: withdrawalMethod === 'upi' ? withdrawalUpiId : undefined,
      bankDetails: withdrawalMethod === 'bank' ? withdrawalBankDetails : undefined,
      walletBalanceAtRequest: user.walletBalance,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Temporarily hold the amount (deduct from balance)
    user.walletBalance -= amount;
    await user.save();
    
    // Create pending transaction
    await Transaction.create({
      user: req.userId,
      type: 'debit',
      category: 'withdrawal',
      amount,
      balanceBefore: withdrawal.walletBalanceAtRequest,
      balanceAfter: user.walletBalance,
      description: `Withdrawal request #${withdrawal._id}`,
      status: 'pending',
      reference: { type: 'withdrawal', id: withdrawal._id }
    });
    
    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted',
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        netAmount: withdrawal.netAmount,
        tds: withdrawal.tds,
        status: withdrawal.status,
        method: withdrawal.method
      }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel withdrawal
exports.cancelWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!withdrawal) {
      throw new NotFoundError('Withdrawal not found');
    }
    
    if (withdrawal.status !== 'pending') {
      throw new BadRequestError('Only pending withdrawals can be cancelled');
    }
    
    // Refund to wallet
    const user = await User.findById(req.userId);
    user.walletBalance += withdrawal.amount;
    await user.save();
    
    // Update withdrawal status
    withdrawal.status = 'cancelled';
    await withdrawal.save();
    
    // Update transaction
    await Transaction.findOneAndUpdate(
      { 'reference.id': withdrawal._id, status: 'pending' },
      { status: 'reversed' }
    );
    
    // Create refund transaction
    await Transaction.create({
      user: req.userId,
      type: 'credit',
      category: 'withdrawal',
      amount: withdrawal.amount,
      balanceBefore: user.walletBalance - withdrawal.amount,
      balanceAfter: user.walletBalance,
      description: `Withdrawal #${withdrawal._id} cancelled - refund`,
      reference: { type: 'withdrawal', id: withdrawal._id }
    });
    
    res.json({
      success: true,
      message: 'Withdrawal cancelled and amount refunded',
      balance: user.walletBalance
    });
  } catch (error) {
    next(error);
  }
};

// Check withdrawal eligibility
exports.checkEligibility = async (req, res, next) => {
  try {
    const eligibility = await Withdrawal.canUserWithdraw(req.userId);
    const user = await User.findById(req.userId)
      .select('walletBalance isKycVerified');
    
    res.json({
      success: true,
      eligible: eligibility.allowed,
      reason: eligibility.reason,
      walletBalance: user.walletBalance,
      isKycVerified: user.isKycVerified,
      minimumWithdrawal: 100
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get pending withdrawals
exports.getPendingWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    
    const query = { status };
    
    const withdrawals = await Withdrawal.find(query)
      .populate('user', 'name phone email isKycVerified')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Withdrawal.countDocuments(query);
    
    // Get summary stats
    const stats = await Withdrawal.aggregate([
      { $match: { status: 'pending' } },
      { 
        $group: { 
          _id: null, 
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        } 
      }
    ]);
    
    res.json({
      success: true,
      withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: stats[0] || { totalAmount: 0, count: 0 }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Approve withdrawal
exports.approveWithdrawal = async (req, res, next) => {
  try {
    const { notes } = req.body;
    
    const withdrawal = await Withdrawal.findById(req.params.id);
    
    if (!withdrawal) {
      throw new NotFoundError('Withdrawal not found');
    }
    
    if (withdrawal.status !== 'pending') {
      throw new BadRequestError('Withdrawal is not pending');
    }
    
    withdrawal.status = 'approved';
    withdrawal.processedBy = req.userId;
    withdrawal.processedAt = new Date();
    withdrawal.processingNotes = notes;
    await withdrawal.save();
    
    // Notify user
    await Notification.createAndPush({
      user: withdrawal.user,
      type: 'withdrawal_approved',
      title: 'Withdrawal Approved',
      message: `Your withdrawal of ₹${withdrawal.amount} has been approved and is being processed.`,
      reference: { type: 'withdrawal', id: withdrawal._id }
    });
    
    // Log admin action
    await AdminLog.log({
      admin: req.userId,
      action: 'withdrawal_approve',
      targetType: 'withdrawal',
      targetId: withdrawal._id,
      description: `Approved withdrawal of ₹${withdrawal.amount}`,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Withdrawal approved',
      withdrawal
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Complete withdrawal
exports.completeWithdrawal = async (req, res, next) => {
  try {
    const { transactionId, paymentReference } = req.body;
    
    const withdrawal = await Withdrawal.findById(req.params.id);
    
    if (!withdrawal) {
      throw new NotFoundError('Withdrawal not found');
    }
    
    if (withdrawal.status !== 'approved') {
      throw new BadRequestError('Withdrawal must be approved first');
    }
    
    withdrawal.status = 'completed';
    withdrawal.transactionId = transactionId;
    withdrawal.paymentReference = paymentReference;
    await withdrawal.save();
    
    // Update transaction status
    await Transaction.findOneAndUpdate(
      { 'reference.id': withdrawal._id },
      { status: 'completed' }
    );
    
    // Notify user
    await Notification.createAndPush({
      user: withdrawal.user,
      type: 'withdrawal_approved',
      title: 'Withdrawal Completed',
      message: `₹${withdrawal.netAmount} has been transferred to your account.`,
      reference: { type: 'withdrawal', id: withdrawal._id },
      priority: 'high'
    });
    
    res.json({
      success: true,
      message: 'Withdrawal completed',
      withdrawal
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Reject withdrawal
exports.rejectWithdrawal = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      throw new BadRequestError('Rejection reason is required');
    }
    
    const withdrawal = await Withdrawal.findById(req.params.id);
    
    if (!withdrawal) {
      throw new NotFoundError('Withdrawal not found');
    }
    
    if (!['pending', 'approved'].includes(withdrawal.status)) {
      throw new BadRequestError('Cannot reject this withdrawal');
    }
    
    // Refund to user
    const user = await User.findById(withdrawal.user);
    user.walletBalance += withdrawal.amount;
    await user.save();
    
    // Update withdrawal
    withdrawal.status = 'rejected';
    withdrawal.rejectedBy = req.userId;
    withdrawal.rejectedAt = new Date();
    withdrawal.rejectionReason = reason;
    await withdrawal.save();
    
    // Update transaction
    await Transaction.findOneAndUpdate(
      { 'reference.id': withdrawal._id },
      { status: 'reversed' }
    );
    
    // Create refund transaction
    await Transaction.create({
      user: withdrawal.user,
      type: 'credit',
      category: 'withdrawal',
      amount: withdrawal.amount,
      balanceBefore: user.walletBalance - withdrawal.amount,
      balanceAfter: user.walletBalance,
      description: `Withdrawal #${withdrawal._id} rejected - refund`,
      reference: { type: 'withdrawal', id: withdrawal._id }
    });
    
    // Notify user
    await Notification.createAndPush({
      user: withdrawal.user,
      type: 'withdrawal_rejected',
      title: 'Withdrawal Rejected',
      message: `Your withdrawal of ₹${withdrawal.amount} was rejected. Reason: ${reason}. Amount refunded.`,
      reference: { type: 'withdrawal', id: withdrawal._id }
    });
    
    // Log admin action
    await AdminLog.log({
      admin: req.userId,
      action: 'withdrawal_reject',
      targetType: 'withdrawal',
      targetId: withdrawal._id,
      description: `Rejected withdrawal of ₹${withdrawal.amount}. Reason: ${reason}`,
      ip: req.ip,
      severity: 'high'
    });
    
    res.json({
      success: true,
      message: 'Withdrawal rejected and amount refunded'
    });
  } catch (error) {
    next(error);
  }
};
