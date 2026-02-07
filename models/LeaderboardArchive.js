const mongoose = require('mongoose');

const leaderboardArchiveSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['global', 'weekly', 'monthly', 'kills'],
        required: true
    },
    period: {
        type: String,
        required: true,
        // Format examples: "2026-W05", "2026-02", "2026-Q1"
    },
    data: [{
        rank: Number,
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userName: String,
        userAvatar: String,
        userLevel: String,
        totalEarnings: {
            type: Number,
            default: 0
        },
        totalKills: {
            type: Number,
            default: 0
        },
        matchesPlayed: {
            type: Number,
            default: 0
        },
        matchesWon: {
            type: Number,
            default: 0
        },
        winRate: {
            type: Number,
            default: 0
        },
        xp: {
            type: Number,
            default: 0
        }
    }],
    metadata: {
        totalUsers: Number,
        topEarning: Number,
        topKills: Number,
        averageWinRate: Number
    },
    archivedAt: {
        type: Date,
        default: Date.now
    },
    archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String
}, {
    timestamps: true
});

// Indexes for efficient querying
leaderboardArchiveSchema.index({ type: 1, period: -1 });
leaderboardArchiveSchema.index({ archivedAt: -1 });

module.exports = mongoose.model('LeaderboardArchive', leaderboardArchiveSchema);
