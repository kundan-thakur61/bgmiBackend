const mongoose = require('mongoose');

const savedPaymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Method type: 'upi' or 'bank'
  method: {
    type: String,
    required: [true, 'Payment method type is required'],
    enum: ['upi', 'bank']
  },
  // UPI Details
  upiId: {
    type: String,
    match: [/^[\w.-]+@[\w.-]+$/, 'Invalid UPI ID format'],
    trim: true,
    lowercase: true
  },
  // Bank Details
  bankDetails: {
    accountHolderName: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      uppercase: true,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    }
  },
  // Nickname for easy identification (e.g., "My SBI Account", "Primary UPI")
  nickname: {
    type: String,
    trim: true,
    maxlength: [50, 'Nickname cannot exceed 50 characters']
  },
  // Is this the default payment method?
  isDefault: {
    type: Boolean,
    default: false
  },
  // Is this method verified/used successfully before?
  isVerified: {
    type: Boolean,
    default: false
  },
  // Last used timestamp
  lastUsedAt: Date,
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes
savedPaymentMethodSchema.index({ user: 1, method: 1 });
savedPaymentMethodSchema.index({ user: 1, isDefault: 1 });

// Pre-save middleware to ensure only one default per user
savedPaymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Remove default from other payment methods of this user
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Virtual for masked account number (e.g., "XXXX1234")
savedPaymentMethodSchema.virtual('maskedAccountNumber').get(function() {
  if (this.method === 'upi') {
    // Mask UPI ID: show first 2 chars and last part after @
    if (this.upiId) {
      const [localPart, domain] = this.upiId.split('@');
      if (localPart.length > 4) {
        return `${localPart.substring(0, 2)}***@${domain}`;
      }
      return this.upiId;
    }
    return null;
  } else if (this.method === 'bank' && this.bankDetails?.accountNumber) {
    // Mask bank account: show last 4 digits
    const accNum = this.bankDetails.accountNumber;
    if (accNum.length > 4) {
      return `XXXX${accNum.slice(-4)}`;
    }
    return `XXXX${accNum}`;
  }
  return null;
});

// Virtual for display name
savedPaymentMethodSchema.virtual('displayName').get(function() {
  if (this.nickname) {
    return this.nickname;
  }
  
  if (this.method === 'upi') {
    return this.upiId || 'UPI Account';
  } else if (this.method === 'bank') {
    const bankName = this.bankDetails?.bankName || 'Bank';
    const masked = this.maskedAccountNumber;
    return `${bankName} ${masked}`;
  }
  
  return 'Payment Method';
});

// Static method to get all payment methods for a user
savedPaymentMethodSchema.statics.getUserPaymentMethods = async function(userId) {
  return await this.find({ user: userId })
    .sort({ isDefault: -1, lastUsedAt: -1, createdAt: -1 });
};

// Static method to get or create default payment method
savedPaymentMethodSchema.statics.getDefaultPaymentMethod = async function(userId) {
  return await this.findOne({ user: userId, isDefault: true });
};

// Static method to verify ownership
savedPaymentMethodSchema.statics.verifyOwnership = async function(paymentMethodId, userId) {
  const method = await this.findOne({ _id: paymentMethodId, user: userId });
  return !!method;
};

// Instance method to mark as used
savedPaymentMethodSchema.methods.markAsUsed = async function() {
  this.lastUsedAt = new Date();
  this.isVerified = true;
  await this.save();
};

// Instance method to get safe/public representation
savedPaymentMethodSchema.methods.toSafeObject = function() {
  const obj = this.toObject({ virtuals: true });
  
  // Remove sensitive data
  if (obj.bankDetails?.accountNumber) {
    delete obj.bankDetails.accountNumber;
  }
  
  // Add masked version
  obj.maskedAccountNumber = this.maskedAccountNumber;
  obj.displayName = this.displayName;
  
  return obj;
};

// Ensure virtuals are included in JSON output
savedPaymentMethodSchema.set('toJSON', { virtuals: true });
savedPaymentMethodSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SavedPaymentMethod', savedPaymentMethodSchema);
