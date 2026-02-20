const { SavedPaymentMethod } = require('../models');
const { BadRequestError, NotFoundError } = require('../middleware/errorHandler');

// Get all saved payment methods for the authenticated user
exports.getSavedPaymentMethods = async (req, res, next) => {
  try {
    const paymentMethods = await SavedPaymentMethod.getUserPaymentMethods(req.userId);
    
    // Return safe representation (masked account numbers)
    const safeMethods = paymentMethods.map(method => method.toSafeObject());
    
    res.json({
      success: true,
      paymentMethods: safeMethods
    });
  } catch (error) {
    next(error);
  }
};

// Get a single saved payment method by ID
exports.getSavedPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const paymentMethod = await SavedPaymentMethod.findOne({
      _id: id,
      user: req.userId
    });
    
    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }
    
    res.json({
      success: true,
      paymentMethod: paymentMethod.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// Create a new saved payment method
exports.createSavedPaymentMethod = async (req, res, next) => {
  try {
    const { method, upiId, bankDetails, nickname, isDefault } = req.body;
    
    // Validate method type
    if (!method || !['upi', 'bank'].includes(method)) {
      throw new BadRequestError('Invalid payment method type. Must be "upi" or "bank"');
    }
    
    // Validate UPI details
    if (method === 'upi') {
      if (!upiId) {
        throw new BadRequestError('UPI ID is required for UPI payment method');
      }
      if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
        throw new BadRequestError('Invalid UPI ID format (e.g., name@upi)');
      }
      
      // Check for duplicate UPI ID
      const existingUPI = await SavedPaymentMethod.findOne({
        user: req.userId,
        method: 'upi',
        upiId: upiId.toLowerCase()
      });
      
      if (existingUPI) {
        throw new BadRequestError('This UPI ID is already saved');
      }
    }
    
    // Validate bank details
    if (method === 'bank') {
      if (!bankDetails?.accountNumber || !bankDetails?.ifscCode || !bankDetails?.accountHolderName) {
        throw new BadRequestError('Account number, IFSC code, and account holder name are required');
      }
      
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails.ifscCode.toUpperCase())) {
        throw new BadRequestError('Invalid IFSC code format');
      }
      
      // Check for duplicate bank account
      const existingBank = await SavedPaymentMethod.findOne({
        user: req.userId,
        method: 'bank',
        'bankDetails.accountNumber': bankDetails.accountNumber
      });
      
      if (existingBank) {
        throw new BadRequestError('This bank account is already saved');
      }
    }
    
    // Check if this is the first payment method (auto-set as default)
    const existingCount = await SavedPaymentMethod.countDocuments({ user: req.userId });
    const shouldBeDefault = existingCount === 0 || isDefault;
    
    // Create the payment method
    const paymentMethod = await SavedPaymentMethod.create({
      user: req.userId,
      method,
      upiId: method === 'upi' ? upiId.toLowerCase() : undefined,
      bankDetails: method === 'bank' ? {
        accountHolderName: bankDetails.accountHolderName,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode.toUpperCase(),
        bankName: bankDetails.bankName || null
      } : undefined,
      nickname: nickname || null,
      isDefault: shouldBeDefault
    });
    
    res.status(201).json({
      success: true,
      message: 'Payment method saved successfully',
      paymentMethod: paymentMethod.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// Update a saved payment method
exports.updateSavedPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nickname, isDefault } = req.body;
    
    const paymentMethod = await SavedPaymentMethod.findOne({
      _id: id,
      user: req.userId
    });
    
    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }
    
    // Update allowed fields
    if (nickname !== undefined) {
      paymentMethod.nickname = nickname;
    }
    
    if (isDefault !== undefined) {
      paymentMethod.isDefault = isDefault;
    }
    
    await paymentMethod.save();
    
    res.json({
      success: true,
      message: 'Payment method updated successfully',
      paymentMethod: paymentMethod.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// Delete a saved payment method
exports.deleteSavedPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const paymentMethod = await SavedPaymentMethod.findOneAndDelete({
      _id: id,
      user: req.userId
    });
    
    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }
    
    // If the deleted method was default, set another as default
    if (paymentMethod.isDefault) {
      const nextMethod = await SavedPaymentMethod.findOne({ user: req.userId });
      if (nextMethod) {
        nextMethod.isDefault = true;
        await nextMethod.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Set a payment method as default
exports.setDefaultPaymentMethod = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const paymentMethod = await SavedPaymentMethod.findOne({
      _id: id,
      user: req.userId
    });
    
    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }
    
    paymentMethod.isDefault = true;
    await paymentMethod.save();
    
    res.json({
      success: true,
      message: 'Default payment method updated',
      paymentMethod: paymentMethod.toSafeObject()
    });
  } catch (error) {
    next(error);
  }
};

// Get full payment method details (for withdrawal processing)
// This is an internal method that returns full account details
exports.getPaymentMethodForWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const paymentMethod = await SavedPaymentMethod.findOne({
      _id: id,
      user: req.userId
    });
    
    if (!paymentMethod) {
      throw new NotFoundError('Payment method not found');
    }
    
    // Return full details for withdrawal processing
    res.json({
      success: true,
      paymentMethod: {
        id: paymentMethod._id,
        method: paymentMethod.method,
        upiId: paymentMethod.upiId,
        bankDetails: paymentMethod.bankDetails,
        displayName: paymentMethod.displayName
      }
    });
  } catch (error) {
    next(error);
  }
};
