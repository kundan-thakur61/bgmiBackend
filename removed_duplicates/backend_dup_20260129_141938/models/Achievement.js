const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: '🏆'
    },
    category: {
        type: String,
        required: true,
        enum: ['matches', 'kills', 'earnings', 'social', 'special'],
        index: true
    },
    // Requirement to unlock
    requirementType: {
        type: String,
        required: true,
        enum: ['matches_played', 'matches_won', 'total_kills', 'total_earnings', 'referrals', 'level', 'streak', 'first_action']
    },
    requirementValue: {
        type: Number,
        required: true
    },
    // Rewards
    xpReward: {
        type: Number,
        default: 0
    },
    bonusReward: {
        type: Number,
        default: 0
    },
    // Display
    isHidden: {
        type: Boolean,
        default: false
    },
    rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    // Order for display
    sortOrder: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
achievementSchema.index({ category: 1, sortOrder: 1 });
achievementSchema.index({ isActive: 1, isHidden: 1 });

// Static: Seed default achievements
achievementSchema.statics.seedDefaults = async function () {
    const defaults = [
        // Matches Category
        { code: 'FIRST_MATCH', name: 'First Blood', description: 'Play your first match', icon: '🎮', category: 'matches', requirementType: 'matches_played', requirementValue: 1, xpReward: 50, rarity: 'common', sortOrder: 1 },
        { code: 'TEN_MATCHES', name: 'Getting Started', description: 'Play 10 matches', icon: '🎯', category: 'matches', requirementType: 'matches_played', requirementValue: 10, xpReward: 100, rarity: 'common', sortOrder: 2 },
        { code: 'FIFTY_MATCHES', name: 'Veteran Player', description: 'Play 50 matches', icon: '⚔️', category: 'matches', requirementType: 'matches_played', requirementValue: 50, xpReward: 300, rarity: 'uncommon', sortOrder: 3 },
        { code: 'HUNDRED_MATCHES', name: 'Battle Hardened', description: 'Play 100 matches', icon: '🛡️', category: 'matches', requirementType: 'matches_played', requirementValue: 100, xpReward: 500, rarity: 'rare', sortOrder: 4 },
        { code: 'FIRST_WIN', name: 'Chicken Dinner!', description: 'Win your first match', icon: '🏆', category: 'matches', requirementType: 'matches_won', requirementValue: 1, xpReward: 100, rarity: 'common', sortOrder: 5 },
        { code: 'TEN_WINS', name: 'Serial Winner', description: 'Win 10 matches', icon: '🥇', category: 'matches', requirementType: 'matches_won', requirementValue: 10, xpReward: 300, rarity: 'uncommon', sortOrder: 6 },
        { code: 'FIFTY_WINS', name: 'Champion', description: 'Win 50 matches', icon: '👑', category: 'matches', requirementType: 'matches_won', requirementValue: 50, xpReward: 1000, rarity: 'epic', sortOrder: 7 },

        // Kills Category
        { code: 'FIRST_KILL', name: 'First Elimination', description: 'Get your first kill', icon: '💀', category: 'kills', requirementType: 'total_kills', requirementValue: 1, xpReward: 25, rarity: 'common', sortOrder: 1 },
        { code: 'FIFTY_KILLS', name: 'Sharpshooter', description: 'Get 50 total kills', icon: '🎯', category: 'kills', requirementType: 'total_kills', requirementValue: 50, xpReward: 150, rarity: 'uncommon', sortOrder: 2 },
        { code: 'HUNDRED_KILLS', name: 'Predator', description: 'Get 100 total kills', icon: '🔥', category: 'kills', requirementType: 'total_kills', requirementValue: 100, xpReward: 300, rarity: 'rare', sortOrder: 3 },
        { code: 'FIVE_HUNDRED_KILLS', name: 'Terminator', description: 'Get 500 total kills', icon: '☠️', category: 'kills', requirementType: 'total_kills', requirementValue: 500, xpReward: 750, rarity: 'epic', sortOrder: 4 },
        { code: 'THOUSAND_KILLS', name: 'Legend', description: 'Get 1000 total kills', icon: '⚡', category: 'kills', requirementType: 'total_kills', requirementValue: 1000, xpReward: 2000, rarity: 'legendary', sortOrder: 5 },

        // Earnings Category
        { code: 'FIRST_EARNING', name: 'Money Maker', description: 'Win your first prize', icon: '💰', category: 'earnings', requirementType: 'total_earnings', requirementValue: 1, xpReward: 50, rarity: 'common', sortOrder: 1 },
        { code: 'EARN_1000', name: 'Rising Star', description: 'Earn ₹1,000 in total', icon: '💵', category: 'earnings', requirementType: 'total_earnings', requirementValue: 1000, xpReward: 200, rarity: 'uncommon', sortOrder: 2 },
        { code: 'EARN_5000', name: 'High Roller', description: 'Earn ₹5,000 in total', icon: '💎', category: 'earnings', requirementType: 'total_earnings', requirementValue: 5000, xpReward: 500, rarity: 'rare', sortOrder: 3 },
        { code: 'EARN_25000', name: 'Pro Player', description: 'Earn ₹25,000 in total', icon: '🤑', category: 'earnings', requirementType: 'total_earnings', requirementValue: 25000, xpReward: 1500, rarity: 'epic', sortOrder: 4 },
        { code: 'EARN_100000', name: 'Esports Star', description: 'Earn ₹1,00,000 in total', icon: '🌟', category: 'earnings', requirementType: 'total_earnings', requirementValue: 100000, xpReward: 5000, rarity: 'legendary', sortOrder: 5 },

        // Social Category
        { code: 'FIRST_REFERRAL', name: 'Networker', description: 'Refer your first friend', icon: '🤝', category: 'social', requirementType: 'referrals', requirementValue: 1, xpReward: 100, rarity: 'common', sortOrder: 1 },
        { code: 'FIVE_REFERRALS', name: 'Team Builder', description: 'Refer 5 friends', icon: '👥', category: 'social', requirementType: 'referrals', requirementValue: 5, xpReward: 300, rarity: 'uncommon', sortOrder: 2 },
        { code: 'TEN_REFERRALS', name: 'Community Leader', description: 'Refer 10 friends', icon: '🎖️', category: 'social', requirementType: 'referrals', requirementValue: 10, xpReward: 750, rarity: 'rare', sortOrder: 3 },

        // Special Category
        { code: 'LEVEL_SILVER', name: 'Silver Status', description: 'Reach Silver level', icon: '⬜', category: 'special', requirementType: 'level', requirementValue: 2, xpReward: 0, rarity: 'uncommon', sortOrder: 1 },
        { code: 'LEVEL_GOLD', name: 'Gold Status', description: 'Reach Gold level', icon: '🔸', category: 'special', requirementType: 'level', requirementValue: 3, xpReward: 0, rarity: 'rare', sortOrder: 2 },
        { code: 'LEVEL_PLATINUM', name: 'Platinum Status', description: 'Reach Platinum level', icon: '💎', category: 'special', requirementType: 'level', requirementValue: 4, xpReward: 0, rarity: 'epic', sortOrder: 3 },
        { code: 'LEVEL_DIAMOND', name: 'Diamond Status', description: 'Reach Diamond level', icon: '👑', category: 'special', requirementType: 'level', requirementValue: 5, xpReward: 0, rarity: 'legendary', sortOrder: 4 },
    ];

    for (const achievement of defaults) {
        await this.findOneAndUpdate(
            { code: achievement.code },
            achievement,
            { upsert: true, new: true }
        );
    }

    console.log('✅ Default achievements seeded');
};

module.exports = mongoose.model('Achievement', achievementSchema);
