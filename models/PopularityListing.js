const mongoose = require('mongoose');

const popularityListingSchema = new mongoose.Schema({
  // Seller information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // BGMI Character ID (for in-game popularity transfer)
  characterId: {
    type: String,
    required: true,
    trim: true
  },
  characterName: {
    type: String,
    required: true,
    trim: true
  },
  // Popularity points available
  popularityPoints: {
    type: Number,
    required: true,
    min: [1000, 'Minimum 1,000 popularity points required'],
    max: [1000000, 'Maximum 10,00,000 popularity points per listing']
  },
  // Points remaining (for partial purchases)
  remainingPoints: {
    type: Number,
    min: 0
  },
  // Pricing (base rate: 1000 points = ₹4)
  pricePerThousand: {
    type: Number,
    default: 4, // ₹4 per 1000 points
    min: 1,
    max: 10
  },
  // Calculated total price
  totalPrice: {
    type: Number
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'sold_out', 'cancelled'],
    default: 'active',
    index: true
  },
  // Statistics
  totalSold: {
    type: Number,
    default: 0
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  // Admin verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  // Notes
  sellerNotes: {
    type: String,
    maxlength: 500
  },
  adminNotes: String,
  // Expiry
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Indexes
popularityListingSchema.index({ status: 1, createdAt: -1 });
popularityListingSchema.index({ seller: 1, status: 1 });
popularityListingSchema.index({ pricePerThousand: 1 });

// Pre-save middleware to calculate total price
popularityListingSchema.pre('save', function(next) {
  this.totalPrice = Math.ceil((this.popularityPoints / 1000) * this.pricePerThousand);
  if (this.isNew) {
    this.remainingPoints = this.popularityPoints;
  }
  next();
});

// Static method to calculate price
popularityListingSchema.statics.calculatePrice = function(points, ratePerThousand = 4) {
  return Math.ceil((points / 1000) * ratePerThousand);
};

// Instance method to check availability
popularityListingSchema.methods.isAvailable = function(points) {
  return this.status === 'active' && this.remainingPoints >= points;
};

// Instance method to purchase points
popularityListingSchema.methods.purchasePoints = async function(points) {
  if (!this.isAvailable(points)) {
    throw new Error('Insufficient popularity points available');
  }
  
  this.remainingPoints -= points;
  this.totalSold += points;
  this.totalTransactions += 1;
  
  if (this.remainingPoints === 0) {
    this.status = 'sold_out';
  }
  
  await this.save();
  return this;
};

// Get active listings
popularityListingSchema.statics.getActiveListings = function(options = {}) {
  const { minPoints, maxPoints, sortBy = 'createdAt', sortOrder = -1, page = 1, limit = 20 } = options;
  
  const query = { 
    status: 'active',
    remainingPoints: { $gt: 0 },
    expiresAt: { $gt: new Date() }
  };
  
  if (minPoints) query.remainingPoints.$gte = minPoints;
  if (maxPoints) query.remainingPoints.$lte = maxPoints;
  
  const sort = {};
  sort[sortBy] = sortOrder;
  
  return this.find(query)
    .populate('seller', 'name avatar level')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model('PopularityListing', popularityListingSchema);
