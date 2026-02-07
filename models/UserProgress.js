const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Level and XP System
    level: {
        type: Number,
        default: 1
    },
    currentXP: {
        type: Number,
        default: 0
    },
    totalXP: {
        type: Number,
        default: 0
    },
    xpToNextLevel: {
        type: Number,
        default: 100
    },
    // Mission Progress
    missionProgress: [{
        mission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Mission'
        },
        progress: {
            type: Number,
            default: 0
        },
        target: Number,
        status: {
            type: String,
            enum: ['in_progress', 'completed', 'claimed'],
            default: 'in_progress'
        },
        startedAt: {
            type: Date,
            default: Date.now
        },
        completedAt: Date,
        claimedAt: Date
    }],
    // Seasonal Pass
    seasonPass: {
        season: { type: Number, default: 1 },
        tier: { type: Number, default: 0 },
        xp: { type: Number, default: 0 },
        isPremium: { type: Boolean, default: false },
        claimedRewards: [{ type: Number }] // Tier numbers of claimed rewards
    },
    // Streaks
    loginStreak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastLogin: Date
    },
    matchStreak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 }
    },
    // Daily Stats
    dailyStats: {
        date: String, // Format: 'YYYY-MM-DD'
        matchesPlayed: { type: Number, default: 0 },
        missionsCompleted: { type: Number, default: 0 },
        xpEarned: { type: Number, default: 0 }
    },
    // Lifetime Stats
    lifetimeStats: {
        totalMissionsCompleted: { type: Number, default: 0 },
        totalRewardsClaimed: { type: Number, default: 0 },
        totalXPEarned: { type: Number, default: 0 }
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate XP needed for next level (exponential curve)
userProgressSchema.methods.calculateXPForLevel = function (level) {
    return Math.floor(100 * Math.pow(1.15, level - 1));
};

// Add XP and handle level ups
userProgressSchema.methods.addXP = function (amount) {
    this.currentXP += amount;
    this.totalXP += amount;
    this.lifetimeStats.totalXPEarned += amount;

    // Check for level up
    while (this.currentXP >= this.xpToNextLevel) {
        this.currentXP -= this.xpToNextLevel;
        this.level += 1;
        this.xpToNextLevel = this.calculateXPForLevel(this.level + 1);
    }

    // Update daily stats
    const today = new Date().toISOString().split('T')[0];
    if (this.dailyStats.date === today) {
        this.dailyStats.xpEarned += amount;
    } else {
        this.dailyStats = {
            date: today,
            matchesPlayed: 0,
            missionsCompleted: 0,
            xpEarned: amount
        };
    }

    this.lastUpdated = Date.now();
};

// Update mission progress
userProgressSchema.methods.updateMissionProgress = function (missionId, progress) {
    const missionIndex = this.missionProgress.findIndex(
        m => m.mission.toString() === missionId.toString()
    );

    if (missionIndex >= 0) {
        this.missionProgress[missionIndex].progress = progress;

        // Check if mission is completed
        if (progress >= this.missionProgress[missionIndex].target) {
            this.missionProgress[missionIndex].status = 'completed';
            this.missionProgress[missionIndex].completedAt = new Date();
        }
    }

    this.lastUpdated = Date.now();
};

// Claim mission reward
userProgressSchema.methods.claimMissionReward = function (missionId) {
    const missionIndex = this.missionProgress.findIndex(
        m => m.mission.toString() === missionId.toString() && m.status === 'completed'
    );

    if (missionIndex >= 0) {
        this.missionProgress[missionIndex].status = 'claimed';
        this.missionProgress[missionIndex].claimedAt = new Date();
        this.lifetimeStats.totalMissionsCompleted += 1;
        this.lifetimeStats.totalRewardsClaimed += 1;

        // Update daily stats
        const today = new Date().toISOString().split('T')[0];
        if (this.dailyStats.date === today) {
            this.dailyStats.missionsCompleted += 1;
        }

        return true;
    }

    return false;
};

// Update login streak
userProgressSchema.methods.updateLoginStreak = function () {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (!this.loginStreak.lastLogin) {
        this.loginStreak.current = 1;
        this.loginStreak.lastLogin = now;
    } else {
        const lastLoginDate = new Date(this.loginStreak.lastLogin).toISOString().split('T')[0];

        if (lastLoginDate === today) {
            // Already logged in today
            return;
        }

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];

        if (lastLoginDate === yesterdayDate) {
            // Consecutive day
            this.loginStreak.current += 1;
            if (this.loginStreak.current > this.loginStreak.longest) {
                this.loginStreak.longest = this.loginStreak.current;
            }
        } else {
            // Streak broken
            this.loginStreak.current = 1;
        }

        this.loginStreak.lastLogin = now;
    }

    this.lastUpdated = Date.now();
};

// Indexes (user already indexed via unique: true in schema)
userProgressSchema.index({ level: -1 });
userProgressSchema.index({ 'seasonPass.tier': -1 });

const UserProgress = mongoose.model('UserProgress', userProgressSchema);

module.exports = UserProgress;
