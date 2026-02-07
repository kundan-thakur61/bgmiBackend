const mongoose = require('mongoose');

const referralStatsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalReferrals: {
        type: Number,
        default: 0
    },
    activeReferrals: {
        type: Number,
        default: 0
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
        default: 'bronze'
    },
    tierProgress: {
        current: { type: Number, default: 0 },
        required: { type: Number, default: 5 } // Referrals needed for next tier
    },
    conversionRate: {
        type: Number,
        default: 0
    },
    referralsByMonth: [{
        month: String, // Format: 'YYYY-MM'
        count: Number,
        earnings: Number
    }],
    topReferrals: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: Date,
        totalSpent: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true }
    }],
    milestones: [{
        type: {
            type: String,
            enum: ['first_referral', '5_referrals', '10_referrals', '25_referrals', '50_referrals', '100_referrals']
        },
        achievedAt: Date,
        reward: Number
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate tier based on active referrals
referralStatsSchema.methods.updateTier = function () {
    const active = this.activeReferrals;

    if (active >= 100) {
        this.tier = 'diamond';
        this.tierProgress.required = 0;
    } else if (active >= 50) {
        this.tier = 'platinum';
        this.tierProgress.current = active - 50;
        this.tierProgress.required = 50;
    } else if (active >= 25) {
        this.tier = 'gold';
        this.tierProgress.current = active - 25;
        this.tierProgress.required = 25;
    } else if (active >= 10) {
        this.tier = 'silver';
        this.tierProgress.current = active - 10;
        this.tierProgress.required = 15;
    } else {
        this.tier = 'bronze';
        this.tierProgress.current = active;
        this.tierProgress.required = 10;
    }

    this.lastUpdated = Date.now();
};

// Calculate conversion rate
referralStatsSchema.methods.updateConversionRate = function () {
    if (this.totalReferrals > 0) {
        this.conversionRate = (this.activeReferrals / this.totalReferrals) * 100;
    }
};

// Add referral
referralStatsSchema.methods.addReferral = async function (referredUser, isActive = true) {
    this.totalReferrals += 1;
    if (isActive) {
        this.activeReferrals += 1;
    }

    // Add to monthly stats
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthIndex = this.referralsByMonth.findIndex(m => m.month === currentMonth);

    if (monthIndex >= 0) {
        this.referralsByMonth[monthIndex].count += 1;
    } else {
        this.referralsByMonth.push({
            month: currentMonth,
            count: 1,
            earnings: 0
        });
    }

    // Add to top referrals
    this.topReferrals.push({
        user: referredUser,
        joinedAt: new Date(),
        isActive: isActive
    });

    // Check milestones
    await this.checkMilestones();

    // Update tier and conversion rate
    this.updateTier();
    this.updateConversionRate();

    this.lastUpdated = Date.now();
};

// Check and award milestones
referralStatsSchema.methods.checkMilestones = async function () {
    const milestoneMap = {
        1: { type: 'first_referral', reward: 50 },
        5: { type: '5_referrals', reward: 100 },
        10: { type: '10_referrals', reward: 250 },
        25: { type: '25_referrals', reward: 500 },
        50: { type: '50_referrals', reward: 1000 },
        100: { type: '100_referrals', reward: 2500 }
    };

    const milestone = milestoneMap[this.totalReferrals];
    if (milestone) {
        const alreadyAchieved = this.milestones.some(m => m.type === milestone.type);
        if (!alreadyAchieved) {
            this.milestones.push({
                type: milestone.type,
                achievedAt: new Date(),
                reward: milestone.reward
            });
            this.totalEarnings += milestone.reward;
            return milestone;
        }
    }
    return null;
};

// Update earnings
referralStatsSchema.methods.addEarnings = function (amount, month = null) {
    this.totalEarnings += amount;

    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const monthIndex = this.referralsByMonth.findIndex(m => m.month === targetMonth);

    if (monthIndex >= 0) {
        this.referralsByMonth[monthIndex].earnings += amount;
    }

    this.lastUpdated = Date.now();
};

// Indexes (user already indexed via unique: true in schema)
referralStatsSchema.index({ tier: 1 });
referralStatsSchema.index({ totalReferrals: -1 });
referralStatsSchema.index({ totalEarnings: -1 });

const ReferralStats = mongoose.model('ReferralStats', referralStatsSchema);

module.exports = ReferralStats;
