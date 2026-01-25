const { Achievement, UserAchievement, User, Match } = require('../models');
const { BadRequestError } = require('../middleware/errorHandler');

// Get all achievements
exports.getAllAchievements = async (req, res, next) => {
    try {
        const { category } = req.query;

        const query = { isActive: true };
        if (category) query.category = category;
        // Don't show hidden achievements unless they're unlocked
        if (!req.userId) query.isHidden = false;

        const achievements = await Achievement.find(query)
            .sort({ category: 1, sortOrder: 1 })
            .lean();

        res.json({
            success: true,
            achievements
        });
    } catch (error) {
        next(error);
    }
};

// Get user's achievements with progress
exports.getMyAchievements = async (req, res, next) => {
    try {
        const achievements = await UserAchievement.getUserAchievements(req.userId);

        // Group by category
        const grouped = achievements.reduce((acc, ach) => {
            if (!acc[ach.category]) {
                acc[ach.category] = [];
            }
            acc[ach.category].push(ach);
            return acc;
        }, {});

        // Calculate summary
        const summary = {
            total: achievements.length,
            unlocked: achievements.filter(a => a.isUnlocked).length,
            totalXpEarned: achievements
                .filter(a => a.isUnlocked)
                .reduce((sum, a) => sum + (a.xpReward || 0), 0)
        };

        res.json({
            success: true,
            achievements: grouped,
            summary
        });
    } catch (error) {
        next(error);
    }
};

// Check and update achievements for current user
exports.checkMyAchievements = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)
            .select('matchesPlayed matchesWon totalEarnings referralCount level');

        // Get total kills from matches
        const killStats = await Match.aggregate([
            { $match: { 'joinedUsers.user': req.user._id, status: 'completed' } },
            { $unwind: '$joinedUsers' },
            { $match: { 'joinedUsers.user': req.user._id } },
            { $group: { _id: null, totalKills: { $sum: '$joinedUsers.kills' } } }
        ]);

        const stats = {
            matchesPlayed: user.matchesPlayed || 0,
            matchesWon: user.matchesWon || 0,
            totalEarnings: user.totalEarnings || 0,
            referralCount: user.referralCount || 0,
            totalKills: killStats[0]?.totalKills || 0,
            level: user.level
        };

        const newlyUnlocked = await UserAchievement.checkAchievements(req.userId, stats);

        res.json({
            success: true,
            newlyUnlocked: newlyUnlocked.map(u => ({
                name: u.achievement.name,
                description: u.achievement.description,
                icon: u.achievement.icon,
                xpReward: u.achievement.xpReward
            }))
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Seed default achievements
exports.seedAchievements = async (req, res, next) => {
    try {
        await Achievement.seedDefaults();

        res.json({
            success: true,
            message: 'Achievements seeded successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Create achievement
exports.createAchievement = async (req, res, next) => {
    try {
        const achievement = await Achievement.create(req.body);

        res.status(201).json({
            success: true,
            achievement
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Update achievement
exports.updateAchievement = async (req, res, next) => {
    try {
        const achievement = await Achievement.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!achievement) {
            throw new BadRequestError('Achievement not found');
        }

        res.json({
            success: true,
            achievement
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Delete achievement
exports.deleteAchievement = async (req, res, next) => {
    try {
        await Achievement.findByIdAndDelete(req.params.id);
        await UserAchievement.deleteMany({ achievement: req.params.id });

        res.json({
            success: true,
            message: 'Achievement deleted'
        });
    } catch (error) {
        next(error);
    }
};
