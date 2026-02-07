const mongoose = require('mongoose');

const seasonalPassSchema = new mongoose.Schema({
    season: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: String,
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    maxTier: {
        type: Number,
        default: 50
    },
    xpPerTier: {
        type: Number,
        default: 1000
    },
    premiumPrice: {
        type: Number,
        default: 499 // in coins/rupees
    },
    tiers: [{
        tier: Number,
        freeReward: {
            type: {
                type: String,
                enum: ['coins', 'xp', 'avatar', 'title', 'skin', 'emote', 'none']
            },
            value: mongoose.Schema.Types.Mixed,
            name: String,
            icon: String
        },
        premiumReward: {
            type: {
                type: String,
                enum: ['coins', 'xp', 'avatar', 'title', 'skin', 'emote', 'exclusive']
            },
            value: mongoose.Schema.Types.Mixed,
            name: String,
            icon: String
        }
    }],
    theme: {
        primaryColor: String,
        secondaryColor: String,
        backgroundImage: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    stats: {
        totalUsers: { type: Number, default: 0 },
        premiumUsers: { type: Number, default: 0 },
        revenueGenerated: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Check if season is currently active
seasonalPassSchema.methods.isCurrentlyActive = function () {
    const now = new Date();
    return this.isActive && now >= this.startDate && now <= this.endDate;
};

// Get all rewards up to a specific tier
seasonalPassSchema.methods.getRewardsUpToTier = function (tier, isPremium = false) {
    const rewards = [];

    for (let i = 0; i <= tier && i < this.tiers.length; i++) {
        const tierData = this.tiers[i];

        // Free reward
        if (tierData.freeReward && tierData.freeReward.type !== 'none') {
            rewards.push({
                tier: tierData.tier,
                ...tierData.freeReward,
                isPremium: false
            });
        }

        // Premium reward
        if (isPremium && tierData.premiumReward) {
            rewards.push({
                tier: tierData.tier,
                ...tierData.premiumReward,
                isPremium: true
            });
        }
    }

    return rewards;
};

// Indexes (season already indexed via unique: true in schema)
seasonalPassSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const SeasonalPass = mongoose.model('SeasonalPass', seasonalPassSchema);

module.exports = SeasonalPass;
