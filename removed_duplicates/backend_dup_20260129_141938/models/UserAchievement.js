const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    achievement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement',
        required: true
    },
    progress: {
        type: Number,
        default: 0
    },
    isUnlocked: {
        type: Boolean,
        default: false,
        index: true
    },
    unlockedAt: Date,
    // For tracking if rewards were claimed
    rewardsClaimed: {
        type: Boolean,
        default: false
    },
    rewardsClaimedAt: Date
}, {
    timestamps: true
});

// Compound index for quick lookups
userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, isUnlocked: 1 });

// Static: Get user's achievements with progress
userAchievementSchema.statics.getUserAchievements = async function (userId) {
    const Achievement = mongoose.model('Achievement');

    // Get all active achievements
    const allAchievements = await Achievement.find({ isActive: true })
        .sort({ category: 1, sortOrder: 1 })
        .lean();

    // Get user's achievement progress
    const userProgress = await this.find({ user: userId })
        .populate('achievement')
        .lean();

    const progressMap = userProgress.reduce((acc, up) => {
        acc[up.achievement._id.toString()] = up;
        return acc;
    }, {});

    // Merge achievements with user progress
    return allAchievements.map(achievement => {
        const userAch = progressMap[achievement._id.toString()];
        return {
            ...achievement,
            progress: userAch?.progress || 0,
            isUnlocked: userAch?.isUnlocked || false,
            unlockedAt: userAch?.unlockedAt,
            progressPercent: Math.min(100, Math.round((userAch?.progress || 0) / achievement.requirementValue * 100))
        };
    });
};

// Static: Check and update achievements for a user
userAchievementSchema.statics.checkAchievements = async function (userId, stats) {
    const Achievement = mongoose.model('Achievement');
    const User = mongoose.model('User');
    const Notification = mongoose.model('Notification');

    const achievements = await Achievement.find({ isActive: true }).lean();
    const newlyUnlocked = [];

    for (const achievement of achievements) {
        let currentValue = 0;

        // Determine current value based on requirement type
        switch (achievement.requirementType) {
            case 'matches_played':
                currentValue = stats.matchesPlayed || 0;
                break;
            case 'matches_won':
                currentValue = stats.matchesWon || 0;
                break;
            case 'total_kills':
                currentValue = stats.totalKills || 0;
                break;
            case 'total_earnings':
                currentValue = stats.totalEarnings || 0;
                break;
            case 'referrals':
                currentValue = stats.referralCount || 0;
                break;
            case 'level':
                const levelOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
                currentValue = levelOrder[stats.level] || 1;
                break;
        }

        const isComplete = currentValue >= achievement.requirementValue;

        // Update or create user achievement record
        const userAch = await this.findOneAndUpdate(
            { user: userId, achievement: achievement._id },
            {
                $set: {
                    progress: currentValue,
                    ...(isComplete && { isUnlocked: true, unlockedAt: new Date() })
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Check if newly unlocked (wasn't unlocked before but is now)
        if (isComplete && !userAch.rewardsClaimed) {
            newlyUnlocked.push({
                achievement,
                userAchievement: userAch
            });
        }
    }

    // Process newly unlocked achievements
    for (const { achievement, userAchievement } of newlyUnlocked) {
        // Award XP and bonus
        if (achievement.xpReward > 0 || achievement.bonusReward > 0) {
            await User.findByIdAndUpdate(userId, {
                $inc: {
                    xp: achievement.xpReward || 0,
                    bonusBalance: achievement.bonusReward || 0
                }
            });
        }

        // Mark rewards as claimed
        await this.findByIdAndUpdate(userAchievement._id, {
            $set: { rewardsClaimed: true, rewardsClaimedAt: new Date() }
        });

        // Create notification
        await Notification.createNotification(
            userId,
            'level_up',
            `Achievement Unlocked: ${achievement.name}!`,
            `Congratulations! You've earned ${achievement.xpReward} XP. ${achievement.description}`,
            { priority: 'high' }
        );
    }

    return newlyUnlocked;
};

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
