const mongoose = require('mongoose');

const prizeDistributionRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  // Match type this rule applies to
  matchType: {
    type: String,
    enum: ['match_win', 'tournament', 'tdm', 'wow', 'special', 'all'],
    default: 'all'
  },
  // Game type this rule applies to
  gameType: {
    type: String,
    enum: ['pubg_mobile', 'free_fire', 'all'],
    default: 'all'
  },
  // Distribution type
  distributionType: {
    type: String,
    enum: ['position_based', 'percentage', 'kill_based', 'hybrid', 'custom'],
    required: true,
    default: 'position_based'
  },
  // Position-based distribution configuration
  positionConfig: {
    positions: [{
      position: {
        type: Number,
        required: true
      },
      prize: {
        type: Number,
        required: true,
        min: 0
      },
      label: {
        type: String,
        default: ''
      },
      // For range-based positions (e.g., positions 4-10)
      positionTo: Number
    }],
    // Total prize pool percentage to distribute (e.g., 80% for positions, 20% for kills)
    poolPercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  },
  // Kill-based distribution configuration
  killConfig: {
    perKillPrize: {
      type: Number,
      default: 0,
      min: 0
    },
    maxKillPrize: {
      type: Number,
      default: null // null means no limit
    },
    // Percentage of prize pool allocated for kills
    poolPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Percentage-based distribution
  percentageConfig: {
    distributions: [{
      label: String,
      percentage: {
        type: Number,
        min: 0,
        max: 100
      },
      criteria: {
        type: String,
        enum: ['winner', 'runner_up', 'semi_finalist', 'top_3', 'top_5', 'top_10', 'most_kills', 'custom']
      }
    }]
  },
  // Minimum participants required for this rule to apply
  minParticipants: {
    type: Number,
    default: 2
  },
  // Maximum participants this rule can handle
  maxParticipants: {
    type: Number,
    default: 100
  },
  // Entry fee range this rule applies to
  entryFeeRange: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: null // null means no upper limit
    }
  },
  // Prize pool range this rule applies to
  prizePoolRange: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: null
    }
  },
  // Rules and regulations text
  rules: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  // Terms and conditions
  termsAndConditions: [{
    type: String
  }],
  // Special conditions
  specialConditions: [{
    condition: String,
    effect: String
  }],
  // Priority for rule matching (higher = more priority)
  priority: {
    type: Number,
    default: 0
  },
  // Is this rule active
  isActive: {
    type: Boolean,
    default: true
  },
  // Is this a default rule (applied when no specific rule matches)
  isDefault: {
    type: Boolean,
    default: false
  },
  // Effective date range
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveUntil: {
    type: Date,
    default: null
  },
  // Created and updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Version for tracking changes
  version: {
    type: Number,
    default: 1
  },
  // Previous versions
  previousVersions: [{
    version: Number,
    data: mongoose.Schema.Types.Mixed,
    changedAt: Date,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changeReason: String
  }]
}, {
  timestamps: true
});

// Indexes
prizeDistributionRuleSchema.index({ matchType: 1, gameType: 1, isActive: 1 });
prizeDistributionRuleSchema.index({ priority: -1 });
prizeDistributionRuleSchema.index({ isDefault: 1 });

// Method to calculate prize distribution for a match
prizeDistributionRuleSchema.methods.calculateDistribution = function(match, participants) {
  const results = [];
  let totalDistributed = 0;

  if (this.distributionType === 'position_based' || this.distributionType === 'hybrid') {
    const positionPool = this.positionConfig.poolPercentage / 100 * match.prizePool;
    
    for (const posConfig of this.positionConfig.positions) {
      const participant = participants.find(p => p.position === posConfig.position);
      if (participant) {
        const prize = posConfig.prize;
        results.push({
          userId: participant.userId,
          position: posConfig.position,
          prize: prize,
          type: 'position'
        });
        totalDistributed += prize;
      }
    }
  }

  if (this.distributionType === 'kill_based' || this.distributionType === 'hybrid') {
    const killPool = this.killConfig.poolPercentage / 100 * match.prizePool;
    let totalKills = participants.reduce((sum, p) => sum + (p.kills || 0), 0);
    
    for (const participant of participants) {
      if (participant.kills > 0) {
        let killPrize = participant.kills * this.killConfig.perKillPrize;
        
        // Apply max limit if set
        if (this.killConfig.maxKillPrize && killPrize > this.killConfig.maxKillPrize) {
          killPrize = this.killConfig.maxKillPrize;
        }
        
        // Check if it would exceed pool
        if (totalDistributed + killPrize > match.prizePool) {
          killPrize = match.prizePool - totalDistributed;
        }
        
        if (killPrize > 0) {
          results.push({
            userId: participant.userId,
            kills: participant.kills,
            prize: killPrize,
            type: 'kill'
          });
          totalDistributed += killPrize;
        }
      }
    }
  }

  return results;
};

// Static method to find applicable rule for a match
prizeDistributionRuleSchema.statics.findApplicableRule = async function(match) {
  // Try to find specific rule first
  let rule = await this.findOne({
    $or: [
      { matchType: match.matchType, gameType: match.gameType },
      { matchType: match.matchType, gameType: 'all' },
      { matchType: 'all', gameType: match.gameType },
      { matchType: 'all', gameType: 'all' }
    ],
    isActive: true,
    minParticipants: { $lte: match.maxSlots },
    maxParticipants: { $gte: match.maxSlots },
    'entryFeeRange.min': { $lte: match.entryFee },
    $or: [
      { 'entryFeeRange.max': null },
      { 'entryFeeRange.max': { $gte: match.entryFee } }
    ],
    'prizePoolRange.min': { $lte: match.prizePool },
    $or: [
      { 'prizePoolRange.max': null },
      { 'prizePoolRange.max': { $gte: match.prizePool } }
    ],
    $or: [
      { effectiveUntil: null },
      { effectiveUntil: { $gt: new Date() } }
    ],
    effectiveFrom: { $lte: new Date() }
  }).sort({ priority: -1 });

  // Fall back to default rule if no specific rule found
  if (!rule) {
    rule = await this.findOne({ isDefault: true, isActive: true });
  }

  return rule;
};

// Pre-save middleware to handle version tracking
prizeDistributionRuleSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// JSON transform
prizeDistributionRuleSchema.set('toJSON', { virtuals: true });
prizeDistributionRuleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PrizeDistributionRule', prizeDistributionRuleSchema);
