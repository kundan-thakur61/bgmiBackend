const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Tournament title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  gameType: {
    type: String,
    required: [true, 'Game type is required'],
    enum: ['pubg_mobile', 'free_fire']
  },
  format: {
    type: String,
    required: true,
    enum: ['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'battle_royale']
  },
  mode: {
    type: String,
    required: true,
    enum: ['solo', 'duo', 'squad']
  },
  // Entry & Prize
  entryFee: {
    type: Number,
    required: true,
    min: [0, 'Entry fee cannot be negative']
  },
  prizePool: {
    type: Number,
    required: true,
    min: [0, 'Prize pool cannot be negative']
  },
  prizeDistribution: [{
    position: Number,
    prize: Number,
    percentage: Number,
    label: String
  }],
  perKillPrize: {
    type: Number,
    default: 0
  },
  // Slots
  maxTeams: {
    type: Number,
    required: true,
    min: 4,
    max: 500
  },
  registeredTeams: {
    type: Number,
    default: 0
  },
  // Rounds/Matches
  rounds: [{
    roundNumber: Number,
    title: String,
    scheduledAt: Date,
    status: {
      type: String,
      enum: ['upcoming', 'live', 'completed'],
      default: 'upcoming'
    },
    matches: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match'
    }]
  }],
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teamName: String,
    teamMembers: [{
      name: String,
      inGameId: String,
      inGameName: String
    }],
    registeredAt: {
      type: Date,
      default: Date.now
    },
    slotNumber: Number,
    // Tournament progress
    currentRound: {
      type: Number,
      default: 1
    },
    isEliminated: {
      type: Boolean,
      default: false
    },
    eliminatedInRound: Number,
    // Stats
    totalKills: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    matchesPlayed: {
      type: Number,
      default: 0
    },
    // Payment
    entryPaid: {
      type: Boolean,
      default: false
    }
  }],
  // Leaderboard
  leaderboard: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    teamName: String,
    position: Number,
    totalKills: Number,
    totalPoints: Number,
    prize: Number,
    prizeDistributed: {
      type: Boolean,
      default: false
    }
  }],
  // Schedule
  registrationStartAt: {
    type: Date,
    required: true
  },
  registrationEndAt: {
    type: Date,
    required: true
  },
  startAt: {
    type: Date,
    required: true
  },
  endAt: Date,
  // Status
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  // Admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Sponsorship
  sponsor: {
    name: String,
    logo: String,
    banner: String,
    website: String
  },
  // Rules & Info
  rules: [String],
  requirements: [String],
  minLevelRequired: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  // Media
  banner: {
    url: String,
    publicId: String
  },
  thumbnail: {
    url: String,
    publicId: String
  },
  // Featured
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Point System
  pointSystem: {
    kill: { type: Number, default: 1 },
    first: { type: Number, default: 15 },
    second: { type: Number, default: 12 },
    third: { type: Number, default: 10 },
    fourth: { type: Number, default: 8 },
    fifth: { type: Number, default: 6 },
    sixth: { type: Number, default: 4 },
    seventh: { type: Number, default: 2 },
    eighth: { type: Number, default: 1 }
  },
  // Streaming
  streamUrl: String,
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
  }
}, {
  timestamps: true
});

// Indexes
tournamentSchema.index({ status: 1, startAt: 1 });
tournamentSchema.index({ gameType: 1, status: 1 });
tournamentSchema.index({ 'participants.user': 1 });
tournamentSchema.index({ isFeatured: 1, status: 1 });

// Virtual for available slots
tournamentSchema.virtual('availableSlots').get(function() {
  return this.maxTeams - this.registeredTeams;
});

// Check if tournament is joinable
tournamentSchema.methods.isJoinable = function() {
  if (this.status !== 'upcoming' && this.status !== 'registration_open') {
    return { joinable: false, reason: 'Registration is not open' };
  }
  if (this.registeredTeams >= this.maxTeams) {
    return { joinable: false, reason: 'Tournament is full' };
  }
  if (new Date() < this.registrationStartAt) {
    return { joinable: false, reason: 'Registration has not started' };
  }
  if (new Date() > this.registrationEndAt) {
    return { joinable: false, reason: 'Registration has ended' };
  }
  return { joinable: true };
};

// Check if user has already joined
tournamentSchema.methods.hasUserJoined = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// Get participant info
tournamentSchema.methods.getParticipant = function(userId) {
  return this.participants.find(p => p.user.toString() === userId.toString());
};

// Add participant
tournamentSchema.methods.addParticipant = function(userId, teamName, teamMembers = []) {
  if (this.hasUserJoined(userId)) {
    throw new Error('Already registered for this tournament');
  }
  
  const slotNumber = this.registeredTeams + 1;
  this.participants.push({
    user: userId,
    teamName,
    teamMembers,
    slotNumber,
    entryPaid: true
  });
  this.registeredTeams = slotNumber;
  
  return slotNumber;
};

// Calculate and update leaderboard
tournamentSchema.methods.updateLeaderboard = function() {
  const sortedParticipants = this.participants
    .filter(p => !p.isEliminated || this.format === 'battle_royale')
    .sort((a, b) => b.totalPoints - a.totalPoints || b.totalKills - a.totalKills);
  
  this.leaderboard = sortedParticipants.map((p, index) => ({
    user: p.user,
    teamName: p.teamName,
    position: index + 1,
    totalKills: p.totalKills,
    totalPoints: p.totalPoints,
    prize: this.prizeDistribution.find(pd => pd.position === index + 1)?.prize || 0
  }));
};

// JSON transform
tournamentSchema.set('toJSON', { virtuals: true });
tournamentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Tournament', tournamentSchema);
