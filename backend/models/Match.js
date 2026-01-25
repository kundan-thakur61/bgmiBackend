const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Match title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  gameType: {
    type: String,
    required: [true, 'Game type is required'],
    enum: ['pubg_mobile', 'free_fire'],
    index: true
  },
  matchType: {
    type: String,
    required: [true, 'Match type is required'],
    enum: ['match_win', 'tournament', 'tdm', 'wow', 'special'],
    index: true
  },
  mode: {
    type: String,
    required: true,
    enum: ['solo', 'duo', 'squad']
  },
  map: {
    type: String,
    enum: ['erangel', 'miramar', 'sanhok', 'vikendi', 'livik', 'karakin', 'bermuda', 'purgatory', 'kalahari', 'alpine', 'nextera', 'other']
  },
  entryFee: {
    type: Number,
    required: [true, 'Entry fee is required'],
    min: [0, 'Entry fee cannot be negative']
  },
  prizePool: {
    type: Number,
    required: [true, 'Prize pool is required'],
    min: [0, 'Prize pool cannot be negative']
  },
  prizeDistribution: [{
    position: Number,
    prize: Number,
    label: String // e.g., "1st Place", "Top 3"
  }],
  perKillPrize: {
    type: Number,
    default: 0
  },
  maxSlots: {
    type: Number,
    required: [true, 'Maximum slots is required'],
    min: [2, 'Minimum 2 slots required'],
    max: [100, 'Maximum 100 slots allowed']
  },
  filledSlots: {
    type: Number,
    default: 0
  },
  minLevelRequired: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  // Room Credentials (revealed before match)
  roomId: {
    type: String,
    select: false
  },
  roomPassword: {
    type: String,
    select: false
  },
  roomCredentialsVisible: {
    type: Boolean,
    default: false
  },
  // Challenge Match fields
  isChallenge: {
    type: Boolean,
    default: false
  },
  creationFee: {
    type: Number,
    default: 0
  },
  // Timing
  scheduledAt: {
    type: Date,
    required: [true, 'Match schedule time is required'],
    index: true
  },
  roomIdRevealTime: Date, // When room ID will be revealed
  registrationCloseTime: Date,
  // Status
  status: {
    type: String,
    enum: ['upcoming', 'registration_open', 'registration_closed', 'room_revealed', 'live', 'completed', 'cancelled', 'result_pending'],
    default: 'upcoming',
    index: true
  },
  // Joined Users
  joinedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    slotNumber: Number,
    inGameName: String,
    inGameId: String,
    // Result data
    kills: {
      type: Number,
      default: 0
    },
    position: Number,
    prizewon: {
      type: Number,
      default: 0
    },
    // Screenshot verification
    screenshot: {
      url: String,
      publicId: String,
      uploadedAt: Date,
      hash: String, // For duplicate detection
      exifData: mongoose.Schema.Types.Mixed
    },
    screenshotStatus: {
      type: String,
      enum: ['not_uploaded', 'pending', 'verified', 'rejected', 'flagged'],
      default: 'not_uploaded'
    },
    screenshotRejectionReason: String,
    // Payment status
    entryPaid: {
      type: Boolean,
      default: false
    },
    prizeDistributed: {
      type: Boolean,
      default: false
    }
  }],
  // Results
  results: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: Number,
    kills: Number,
    prize: Number,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date
  }],
  resultDeclaredAt: Date,
  // Admin & Host
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Sponsorship
  sponsor: {
    name: String,
    logo: String,
    banner: String
  },
  // Match Rules
  rules: [{
    type: String
  }],
  // Cancellation
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  refundsProcessed: {
    type: Boolean,
    default: false
  },
  // Featured/Special
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  // Streaming
  streamUrl: String,
  spectatorSlots: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
matchSchema.index({ status: 1, scheduledAt: 1 });
matchSchema.index({ gameType: 1, matchType: 1, status: 1 });
matchSchema.index({ 'joinedUsers.user': 1 });
matchSchema.index({ scheduledAt: -1 });
matchSchema.index({ isFeatured: 1, status: 1 });

// Virtual for available slots
matchSchema.virtual('availableSlots').get(function () {
  return this.maxSlots - this.filledSlots;
});

// Check if match is joinable
matchSchema.methods.isJoinable = function () {
  if (this.status !== 'upcoming' && this.status !== 'registration_open') {
    return { joinable: false, reason: 'Registration is closed' };
  }
  if (this.filledSlots >= this.maxSlots) {
    return { joinable: false, reason: 'Match is full' };
  }
  if (this.registrationCloseTime && new Date() > this.registrationCloseTime) {
    return { joinable: false, reason: 'Registration time has ended' };
  }
  return { joinable: true };
};

// Check if user has already joined
matchSchema.methods.hasUserJoined = function (userId) {
  return this.joinedUsers.some(ju => {
    // Handle both populated and non-populated user field
    const joinedUserId = ju.user._id ? ju.user._id : ju.user;
    return joinedUserId.toString() === userId.toString();
  });
};

// Get user's slot info
matchSchema.methods.getUserSlot = function (userId) {
  return this.joinedUsers.find(ju => {
    // Handle both populated and non-populated user field
    const joinedUserId = ju.user._id ? ju.user._id : ju.user;
    return joinedUserId.toString() === userId.toString();
  });
};

// Add user to match
matchSchema.methods.addUser = function (userId, inGameName, inGameId) {
  if (this.hasUserJoined(userId)) {
    throw new Error('User has already joined this match');
  }

  const slotNumber = this.filledSlots + 1;
  this.joinedUsers.push({
    user: userId,
    slotNumber,
    inGameName,
    inGameId,
    entryPaid: true
  });
  this.filledSlots = slotNumber;

  return slotNumber;
};

// Remove user from match
matchSchema.methods.removeUser = function (userId) {
  const index = this.joinedUsers.findIndex(ju => ju.user.toString() === userId.toString());
  if (index === -1) {
    throw new Error('User not found in match');
  }
  this.joinedUsers.splice(index, 1);
  this.filledSlots -= 1;
};

// Pre-save middleware
matchSchema.pre('save', function (next) {
  // Set room reveal time (15 minutes before match)
  if (this.isModified('scheduledAt') && !this.roomIdRevealTime) {
    this.roomIdRevealTime = new Date(this.scheduledAt.getTime() - 15 * 60 * 1000);
  }

  // Set registration close time
  if (this.isModified('scheduledAt') && !this.registrationCloseTime) {
    // For challenge matches, allow joining until start time
    // For organized tournaments/matches, close 30 minutes before
    const bufferTime = this.isChallenge ? 0 : 30 * 60 * 1000;
    this.registrationCloseTime = new Date(this.scheduledAt.getTime() - bufferTime);
  }

  next();
});

// JSON transform to include virtuals
matchSchema.set('toJSON', { virtuals: true });
matchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Match', matchSchema);
