const mongoose = require('mongoose');

const popularityTransactionSchema = new mongoose.Schema({
  // Transaction parties
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PopularityListing',
    required: true
  },
  // Popularity details
  popularityPoints: {
    type: Number,
    required: true,
    min: 1000
  },
  // Pricing
  pricePerThousand: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  // Platform fee (5% of transaction)
  platformFee: {
    type: Number,
    required: true
  },
  sellerEarnings: {
    type: Number,
    required: true
  },
  // BGMI Character details for transfer
  buyerCharacterId: {
    type: String,
    required: true
  },
  buyerCharacterName: {
    type: String,
    required: true
  },
  // Transaction status
  status: {
    type: String,
    enum: [
      'pending',           // Payment pending
      'payment_done',      // Payment completed, waiting for popularity transfer
      'transferred',       // Seller confirmed transfer
      'completed',         // Buyer confirmed receipt
      'disputed',          // Buyer raised dispute
      'cancelled',         // Transaction cancelled
      'refunded'           // Money refunded to buyer
    ],
    default: 'pending',
    index: true
  },
  // Timeline
  paymentAt: Date,
  transferAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  // Transfer proof
  transferProof: {
    screenshot: {
      url: String,
      publicId: String
    },
    transferredAt: Date,
    notes: String
  },
  // Dispute details
  dispute: {
    reason: String,
    raisedAt: Date,
    resolvedAt: Date,
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Cancellation
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: Date
  },
  // Auto-confirmation timer (48 hours)
  autoConfirmAt: Date,
  // Rating
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    ratedAt: Date
  },
  // IP and device tracking
  ip: String,
  userAgent: String
}, {
  timestamps: true
});

// Indexes
popularityTransactionSchema.index({ buyer: 1, status: 1 });
popularityTransactionSchema.index({ seller: 1, status: 1 });
popularityTransactionSchema.index({ status: 1, createdAt: -1 });
popularityTransactionSchema.index({ autoConfirmAt: 1 });

// Pre-save middleware
popularityTransactionSchema.pre('save', function(next) {
  if (this.isNew) {
    // Calculate platform fee (5%)
    this.platformFee = Math.ceil(this.totalAmount * 0.05);
    this.sellerEarnings = this.totalAmount - this.platformFee;
    
    // Set auto-confirmation time (48 hours after payment)
    this.autoConfirmAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }
  next();
});

// Static method to create transaction
popularityTransactionSchema.statics.createTransaction = async function(data) {
  const { buyerId, listingId, points, buyerCharacterId, buyerCharacterName, ip, userAgent } = data;
  
  const listing = await mongoose.model('PopularityListing').findById(listingId);
  if (!listing) throw new Error('Listing not found');
  if (!listing.isAvailable(points)) throw new Error('Insufficient popularity points available');
  
  const totalAmount = Math.ceil((points / 1000) * listing.pricePerThousand);
  
  const transaction = await this.create({
    buyer: buyerId,
    seller: listing.seller,
    listing: listingId,
    popularityPoints: points,
    pricePerThousand: listing.pricePerThousand,
    totalAmount,
    buyerCharacterId,
    buyerCharacterName,
    ip,
    userAgent
  });
  
  return transaction;
};

// Get user's transactions
popularityTransactionSchema.statics.getUserTransactions = function(userId, role = 'all', options = {}) {
  const { status, page = 1, limit = 20 } = options;
  
  const query = {};
  
  if (role === 'buyer') query.buyer = userId;
  else if (role === 'seller') query.seller = userId;
  else query.$or = [{ buyer: userId }, { seller: userId }];
  
  if (status) query.status = status;
  
  return this.find(query)
    .populate('buyer', 'name avatar')
    .populate('seller', 'name avatar')
    .populate('listing', 'characterId characterName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

module.exports = mongoose.model('PopularityTransaction', popularityTransactionSchema);