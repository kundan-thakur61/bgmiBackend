const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['daily', 'weekly', 'special', 'seasonal'],
        required: true
    },
    category: {
        type: String,
        enum: ['matches', 'kills', 'tournaments', 'social', 'wallet', 'general'],
        required: true
    },
    requirement: {
        action: {
            type: String,
            required: true
            // Examples: 'play_matches', 'get_kills', 'win_matches', 'invite_friends', 'deposit_funds'
        },
        target: {
            type: Number,
            required: true
            // Number of times action needs to be performed
        },
        conditions: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
            // Additional conditions like gameMode: 'squad', tournamentType: 'premium'
        }
    },
    rewards: {
        xp: { type: Number, default: 0 },
        coins: { type: Number, default: 0 },
        items: [{
            type: String
        }]
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard', 'expert'],
        default: 'easy'
    },
    icon: String,
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: Date,
    endDate: Date,
    maxCompletions: {
        type: Number,
        default: 1 // How many times can be completed
    },
    order: {
        type: Number,
        default: 0 // Display order
    }
}, {
    timestamps: true
});

// Indexes
missionSchema.index({ type: 1, isActive: 1 });
missionSchema.index({ startDate: 1, endDate: 1 });
missionSchema.index({ category: 1 });

const Mission = mongoose.model('Mission', missionSchema);

module.exports = Mission;
