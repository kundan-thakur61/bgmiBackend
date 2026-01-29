const { User, Transaction, Notification } = require('../models');
const { createOrder, verifyPaymentSignature, fetchPayment } = require('../config/razorpay');
const { BadRequestError } = require('../middleware/errorHandler');
const crypto = require('crypto');

// Get wallet balance
exports.getBalance = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('walletBalance bonusBalance');
    
    res.json({
      success: true,
      balance: {
        wallet: user.walletBalance,
        bonus: user.bonusBalance,
        total: user.walletBalance + user.bonusBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get transaction history
exports.getTransactions = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      category,
      startDate,
      endDate 
    } = req.query;
    
    const transactions = await Transaction.getUserHistory(req.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      category,
      startDate,
      endDate
    });
    
    const total = await Transaction.countDocuments({
      user: req.userId,
      ...(type && { type }),
      ...(category && { category })
    });
    
    res.json({
      success: true,
      transactions,
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

// Create deposit order
exports.createDeposit = async (req, res, next) => {
  try {
    const { amount } = req.body;
    
    // Validate amount
    if (!amount || amount < 10) {
      throw new BadRequestError('Minimum deposit amount is ₹10');
    }
    
    if (amount > 50000) {
      throw new BadRequestError('Maximum deposit amount is ₹50,000');
    }
    
    // Create Razorpay order
    const order = await createOrder(
      amount, 
      'INR', 
      `bz_deposit_${req.userId}_${Date.now()}`
    );
    
    // Create pending transaction
    const transaction = await Transaction.create({
      user: req.userId,
      type: 'credit',
      category: 'deposit',
      amount,
      balanceBefore: req.user.walletBalance,
      balanceAfter: req.user.walletBalance, // Will update after verification
      description: `Wallet deposit of ₹${amount}`,
      status: 'pending',
      paymentDetails: {
        gateway: 'razorpay',
        orderId: order.id
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      transactionId: transaction._id,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    next(error);
  }
};

// Verify payment
exports.verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    
    // Find pending transaction
    const transaction = await Transaction.findOne({
      user: req.userId,
      'paymentDetails.orderId': orderId,
      status: 'pending'
    });
    
    if (!transaction) {
      throw new BadRequestError('Transaction not found');
    }
    
    // Verify signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    
    if (!isValid) {
      transaction.status = 'failed';
      await transaction.save();
      throw new BadRequestError('Payment verification failed');
    }
    
    // Fetch payment details from Razorpay
    const payment = await fetchPayment(paymentId);
    
    if (payment.status !== 'captured') {
      transaction.status = 'failed';
      await transaction.save();
      throw new BadRequestError('Payment not captured');
    }
    
    // Update user balance
    const user = await User.findById(req.userId);
    const previousBalance = user.walletBalance;
    user.walletBalance += transaction.amount;
    await user.save();
    
    // Update transaction
    transaction.status = 'completed';
    transaction.balanceAfter = user.walletBalance;
    transaction.paymentDetails.paymentId = paymentId;
    transaction.paymentDetails.signature = signature;
    transaction.paymentDetails.method = payment.method;
    transaction.paymentDetails.vpa = payment.vpa;
    await transaction.save();
    
    // Send notification
    await Notification.createAndPush({
      user: req.userId,
      type: 'deposit_success',
      title: 'Deposit Successful',
      message: `₹${transaction.amount} has been added to your wallet.`,
      reference: { type: 'transaction', id: transaction._id }
    });
    
    res.json({
      success: true,
      message: 'Payment successful',
      balance: user.walletBalance,
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Razorpay webhook
exports.razorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Verify webhook signature
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');
    
    if (digest !== req.headers['x-razorpay-signature']) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    
    const event = req.body.event;
    const payload = req.body.payload;
    
    if (event === 'payment.captured') {
      const orderId = payload.payment.entity.order_id;
      const paymentId = payload.payment.entity.id;
      
      // Find and update transaction
      const transaction = await Transaction.findOne({
        'paymentDetails.orderId': orderId,
        status: 'pending'
      });
      
      if (transaction) {
        const user = await User.findById(transaction.user);
        user.walletBalance += transaction.amount;
        await user.save();
        
        transaction.status = 'completed';
        transaction.balanceAfter = user.walletBalance;
        transaction.paymentDetails.paymentId = paymentId;
        await transaction.save();
        
        // Send notification
        await Notification.createAndPush({
          user: transaction.user,
          type: 'deposit_success',
          title: 'Deposit Successful',
          message: `₹${transaction.amount} has been added to your wallet.`,
          reference: { type: 'transaction', id: transaction._id }
        });
      }
    }
    
    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};
