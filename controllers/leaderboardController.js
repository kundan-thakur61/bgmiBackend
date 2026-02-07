const { User, Match } = require('../models');

// Get global leaderboard (all-time)
exports.getGlobalLeaderboard = async (req, res, next) => {
    try {
        const { limit = 100, page = 1, gameType } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build aggregation pipeline for user stats
        const matchFilter = gameType ? { gameType } : {};

        // Get top users by total earnings
        const users = await User.find({
            isBanned: false,
            isActive: true,
            matchesPlayed: { $gt: 0 }
        })
            .select('name avatar level totalEarnings matchesPlayed matchesWon xp')
            .sort({ totalEarnings: -1, matchesWon: -1, xp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Add rank to each user
        const rankedUsers = users.map((user, index) => ({
            rank: skip + index + 1,
            ...user,
            winRate: user.matchesPlayed > 0
                ? Math.round((user.matchesWon / user.matchesPlayed) * 100)
                : 0
        }));

        // Get current user's rank if authenticated
        let userRank = null;
        if (req.userId) {
            const currentUser = await User.findById(req.userId).select('totalEarnings');
            if (currentUser) {
                const usersAbove = await User.countDocuments({
                    isBanned: false,
                    isActive: true,
                    totalEarnings: { $gt: currentUser.totalEarnings }
                });
                userRank = usersAbove + 1;
            }
        }

        const total = await User.countDocuments({
            isBanned: false,
            isActive: true,
            matchesPlayed: { $gt: 0 }
        });

        res.json({
            success: true,
            leaderboard: rankedUsers,
            userRank,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get weekly leaderboard
exports.getWeeklyLeaderboard = async (req, res, next) => {
    try {
        const { limit = 100, page = 1, gameType } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get start of current week (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diffToMonday);
        weekStart.setHours(0, 0, 0, 0);

        // Aggregate match results for this week
        const matchFilter = {
            status: 'completed',
            resultDeclaredAt: { $gte: weekStart },
            ...(gameType && { gameType })
        };

        const weeklyStats = await Match.aggregate([
            { $match: matchFilter },
            { $unwind: '$joinedUsers' },
            { $match: { 'joinedUsers.prizewon': { $gt: 0 } } },
            {
                $group: {
                    _id: '$joinedUsers.user',
                    totalEarnings: { $sum: '$joinedUsers.prizewon' },
                    totalKills: { $sum: '$joinedUsers.kills' },
                    matchesPlayed: { $sum: 1 },
                    wins: {
                        $sum: {
                            $cond: [{ $eq: ['$joinedUsers.position', 1] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { totalEarnings: -1, wins: -1, totalKills: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        // Populate user info
        const userIds = weeklyStats.map(stat => stat._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select('name avatar level')
            .lean();

        const userMap = users.reduce((acc, user) => {
            acc[user._id.toString()] = user;
            return acc;
        }, {});

        const rankedUsers = weeklyStats.map((stat, index) => ({
            rank: skip + index + 1,
            user: userMap[stat._id.toString()] || { name: 'Unknown' },
            totalEarnings: stat.totalEarnings,
            totalKills: stat.totalKills,
            matchesPlayed: stat.matchesPlayed,
            wins: stat.wins,
            winRate: stat.matchesPlayed > 0
                ? Math.round((stat.wins / stat.matchesPlayed) * 100)
                : 0
        }));

        res.json({
            success: true,
            leaderboard: rankedUsers,
            weekStart: weekStart.toISOString(),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: weeklyStats.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get monthly leaderboard
exports.getMonthlyLeaderboard = async (req, res, next) => {
    try {
        const { limit = 100, page = 1, gameType, month, year } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get start and end of month
        const now = new Date();
        const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
        const targetYear = year ? parseInt(year) : now.getFullYear();

        const monthStart = new Date(targetYear, targetMonth, 1);
        const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        // Aggregate match results for this month
        const matchFilter = {
            status: 'completed',
            resultDeclaredAt: { $gte: monthStart, $lte: monthEnd },
            ...(gameType && { gameType })
        };

        const monthlyStats = await Match.aggregate([
            { $match: matchFilter },
            { $unwind: '$joinedUsers' },
            {
                $group: {
                    _id: '$joinedUsers.user',
                    totalEarnings: { $sum: '$joinedUsers.prizewon' },
                    totalKills: { $sum: '$joinedUsers.kills' },
                    matchesPlayed: { $sum: 1 },
                    wins: {
                        $sum: {
                            $cond: [{ $eq: ['$joinedUsers.position', 1] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { totalEarnings: -1, wins: -1, totalKills: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        // Populate user info
        const userIds = monthlyStats.map(stat => stat._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select('name avatar level')
            .lean();

        const userMap = users.reduce((acc, user) => {
            acc[user._id.toString()] = user;
            return acc;
        }, {});

        const rankedUsers = monthlyStats.map((stat, index) => ({
            rank: skip + index + 1,
            user: userMap[stat._id.toString()] || { name: 'Unknown' },
            totalEarnings: stat.totalEarnings,
            totalKills: stat.totalKills,
            matchesPlayed: stat.matchesPlayed,
            wins: stat.wins,
            winRate: stat.matchesPlayed > 0
                ? Math.round((stat.wins / stat.matchesPlayed) * 100)
                : 0
        }));

        res.json({
            success: true,
            leaderboard: rankedUsers,
            month: targetMonth + 1,
            year: targetYear,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: monthlyStats.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get kills leaderboard
exports.getKillsLeaderboard = async (req, res, next) => {
    try {
        const { limit = 100, page = 1, gameType, period = 'all' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let dateFilter = {};
        const now = new Date();

        if (period === 'weekly') {
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - diffToMonday);
            weekStart.setHours(0, 0, 0, 0);
            dateFilter = { resultDeclaredAt: { $gte: weekStart } };
        } else if (period === 'monthly') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { resultDeclaredAt: { $gte: monthStart } };
        }

        const matchFilter = {
            status: 'completed',
            ...dateFilter,
            ...(gameType && { gameType })
        };

        const killsStats = await Match.aggregate([
            { $match: matchFilter },
            { $unwind: '$joinedUsers' },
            {
                $group: {
                    _id: '$joinedUsers.user',
                    totalKills: { $sum: '$joinedUsers.kills' },
                    matchesPlayed: { $sum: 1 },
                    avgKills: { $avg: '$joinedUsers.kills' }
                }
            },
            { $sort: { totalKills: -1, avgKills: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit) }
        ]);

        // Populate user info
        const userIds = killsStats.map(stat => stat._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select('name avatar level')
            .lean();

        const userMap = users.reduce((acc, user) => {
            acc[user._id.toString()] = user;
            return acc;
        }, {});

        const rankedUsers = killsStats.map((stat, index) => ({
            rank: skip + index + 1,
            user: userMap[stat._id.toString()] || { name: 'Unknown' },
            totalKills: stat.totalKills,
            matchesPlayed: stat.matchesPlayed,
            avgKills: Math.round(stat.avgKills * 10) / 10
        }));

        res.json({
            success: true,
            leaderboard: rankedUsers,
            period,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: killsStats.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get top earners
exports.getTopEarners = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const topEarners = await User.find({
            isBanned: false,
            isActive: true,
            totalEarnings: { $gt: 0 }
        })
            .select('name avatar level totalEarnings matchesWon')
            .sort({ totalEarnings: -1 })
            .limit(parseInt(limit))
            .lean();

        const rankedEarners = topEarners.map((user, index) => ({
            rank: index + 1,
            ...user
        }));

        res.json({
            success: true,
            topEarners: rankedEarners
        });
    } catch (error) {
        next(error);
    }
};

// ==================== ADMIN METHODS ====================

// Update user stats manually
exports.updateUserStats = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { totalEarnings, totalKills, matchesPlayed, matchesWon, xp } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update stats if provided
        if (totalEarnings !== undefined) user.totalEarnings = totalEarnings;
        if (totalKills !== undefined) user.totalKills = totalKills;
        if (matchesPlayed !== undefined) user.matchesPlayed = matchesPlayed;
        if (matchesWon !== undefined) user.matchesWon = matchesWon;
        if (xp !== undefined) user.xp = xp;

        await user.save();

        res.json({
            success: true,
            message: 'User stats updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                totalEarnings: user.totalEarnings,
                totalKills: user.totalKills,
                matchesPlayed: user.matchesPlayed,
                matchesWon: user.matchesWon,
                xp: user.xp
            }
        });
    } catch (error) {
        next(error);
    }
};

// Add user to leaderboard with custom stats
exports.addUserToLeaderboard = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { totalEarnings = 0, totalKills = 0, matchesPlayed = 0, matchesWon = 0 } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Set stats
        user.totalEarnings = totalEarnings;
        user.totalKills = totalKills;
        user.matchesPlayed = matchesPlayed;
        user.matchesWon = matchesWon;
        user.isActive = true;
        user.isBanned = false;

        await user.save();

        res.json({
            success: true,
            message: 'User added to leaderboard successfully',
            user
        });
    } catch (error) {
        next(error);
    }
};

// Remove user from leaderboard (set to inactive)
exports.removeUserFromLeaderboard = async (req, res, next) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User removed from leaderboard',
            user
        });
    } catch (error) {
        next(error);
    }
};

// Reset weekly leaderboard (archives first, then resets match results)
exports.resetWeeklyLeaderboard = async (req, res, next) => {
    try {
        const { Match } = require('../models');
        const LeaderboardArchive = require('../models/LeaderboardArchive');

        // Get current week start
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diffToMonday);
        weekStart.setHours(0, 0, 0, 0);

        // Get current weekly leaderboard for archiving
        const weeklyStats = await Match.aggregate([
            {
                $match: {
                    status: 'completed',
                    resultDeclaredAt: { $gte: weekStart }
                }
            },
            { $unwind: '$joinedUsers' },
            {
                $group: {
                    _id: '$joinedUsers.user',
                    totalEarnings: { $sum: '$joinedUsers.prizewon' },
                    totalKills: { $sum: '$joinedUsers.kills' },
                    matchesPlayed: { $sum: 1 },
                    wins: {
                        $sum: {
                            $cond: [{ $eq: ['$joinedUsers.position', 1] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { totalEarnings: -1 } },
            { $limit: 100 }
        ]);

        // Populate user info for archive
        const userIds = weeklyStats.map(stat => stat._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select('name avatar level')
            .lean();

        const userMap = users.reduce((acc, user) => {
            acc[user._id.toString()] = user;
            return acc;
        }, {});

        // Create archive data
        const archiveData = weeklyStats.map((stat, index) => ({
            rank: index + 1,
            userId: stat._id,
            userName: userMap[stat._id.toString()]?.name || 'Unknown',
            userAvatar: userMap[stat._id.toString()]?.avatar,
            userLevel: userMap[stat._id.toString()]?.level,
            totalEarnings: stat.totalEarnings,
            totalKills: stat.totalKills,
            matchesPlayed: stat.matchesPlayed,
            matchesWon: stat.wins,
            winRate: stat.matchesPlayed > 0
                ? Math.round((stat.wins / stat.matchesPlayed) * 100)
                : 0
        }));

        // Save archive
        const weekNumber = getWeekNumber(now);
        const period = `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;

        await LeaderboardArchive.create({
            type: 'weekly',
            period,
            data: archiveData,
            metadata: {
                totalUsers: archiveData.length,
                topEarning: archiveData[0]?.totalEarnings || 0,
                topKills: Math.max(...archiveData.map(d => d.totalKills), 0),
                averageWinRate: archiveData.reduce((sum, d) => sum + d.winRate, 0) / archiveData.length || 0
            },
            archivedBy: req.userId
        });

        res.json({
            success: true,
            message: 'Weekly leaderboard archived and will reset at next week start',
            archived: {
                period,
                totalUsers: archiveData.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// Reset monthly leaderboard
exports.resetMonthlyLeaderboard = async (req, res, next) => {
    try {
        const { Match } = require('../models');
        const LeaderboardArchive = require('../models/LeaderboardArchive');

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Get current monthly leaderboard for archiving
        const monthlyStats = await Match.aggregate([
            {
                $match: {
                    status: 'completed',
                    resultDeclaredAt: { $gte: monthStart, $lte: monthEnd }
                }
            },
            { $unwind: '$joinedUsers' },
            {
                $group: {
                    _id: '$joinedUsers.user',
                    totalEarnings: { $sum: '$joinedUsers.prizewon' },
                    totalKills: { $sum: '$joinedUsers.kills' },
                    matchesPlayed: { $sum: 1 },
                    wins: {
                        $sum: {
                            $cond: [{ $eq: ['$joinedUsers.position', 1] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { totalEarnings: -1 } },
            { $limit: 100 }
        ]);

        // Populate user info
        const userIds = monthlyStats.map(stat => stat._id);
        const users = await User.find({ _id: { $in: userIds } })
            .select('name avatar level')
            .lean();

        const userMap = users.reduce((acc, user) => {
            acc[user._id.toString()] = user;
            return acc;
        }, {});

        // Create archive data
        const archiveData = monthlyStats.map((stat, index) => ({
            rank: index + 1,
            userId: stat._id,
            userName: userMap[stat._id.toString()]?.name || 'Unknown',
            userAvatar: userMap[stat._id.toString()]?.avatar,
            userLevel: userMap[stat._id.toString()]?.level,
            totalEarnings: stat.totalEarnings,
            totalKills: stat.totalKills,
            matchesPlayed: stat.matchesPlayed,
            matchesWon: stat.wins,
            winRate: stat.matchesPlayed > 0
                ? Math.round((stat.wins / stat.matchesPlayed) * 100)
                : 0
        }));

        // Save archive
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        await LeaderboardArchive.create({
            type: 'monthly',
            period,
            data: archiveData,
            metadata: {
                totalUsers: archiveData.length,
                topEarning: archiveData[0]?.totalEarnings || 0,
                topKills: Math.max(...archiveData.map(d => d.totalKills), 0),
                averageWinRate: archiveData.reduce((sum, d) => sum + d.winRate, 0) / archiveData.length || 0
            },
            archivedBy: req.userId
        });

        res.json({
            success: true,
            message: 'Monthly leaderboard archived and will reset at next month start',
            archived: {
                period,
                totalUsers: archiveData.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// Archive current leaderboard
exports.archiveLeaderboard = async (req, res, next) => {
    try {
        const LeaderboardArchive = require('../models/LeaderboardArchive');
        const { type = 'global', notes } = req.body;

        let period;
        const now = new Date();

        if (type === 'weekly') {
            const weekNumber = getWeekNumber(now);
            period = `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
        } else if (type === 'monthly') {
            period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        } else {
            period = now.toISOString().split('T')[0]; // YYYY-MM-DD
        }

        // Get current leaderboard
        const users = await User.find({
            isBanned: false,
            isActive: true,
            matchesPlayed: { $gt: 0 }
        })
            .select('name avatar level totalEarnings matchesPlayed matchesWon totalKills xp')
            .sort({ totalEarnings: -1, matchesWon: -1, xp: -1 })
            .limit(100)
            .lean();

        const archiveData = users.map((user, index) => ({
            rank: index + 1,
            userId: user._id,
            userName: user.name,
            userAvatar: user.avatar,
            userLevel: user.level,
            totalEarnings: user.totalEarnings || 0,
            totalKills: user.totalKills || 0,
            matchesPlayed: user.matchesPlayed || 0,
            matchesWon: user.matchesWon || 0,
            winRate: user.matchesPlayed > 0
                ? Math.round((user.matchesWon / user.matchesPlayed) * 100)
                : 0,
            xp: user.xp || 0
        }));

        const archive = await LeaderboardArchive.create({
            type,
            period,
            data: archiveData,
            metadata: {
                totalUsers: archiveData.length,
                topEarning: archiveData[0]?.totalEarnings || 0,
                topKills: Math.max(...archiveData.map(d => d.totalKills), 0),
                averageWinRate: archiveData.reduce((sum, d) => sum + d.winRate, 0) / archiveData.length || 0
            },
            archivedBy: req.userId,
            notes
        });

        res.json({
            success: true,
            message: 'Leaderboard archived successfully',
            archive: {
                id: archive._id,
                type: archive.type,
                period: archive.period,
                totalUsers: archiveData.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get archived leaderboards
exports.getArchivedLeaderboards = async (req, res, next) => {
    try {
        const LeaderboardArchive = require('../models/LeaderboardArchive');
        const { type, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = type ? { type } : {};

        const archives = await LeaderboardArchive.find(query)
            .select('type period metadata archivedAt archivedBy')
            .populate('archivedBy', 'name email')
            .sort({ archivedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await LeaderboardArchive.countDocuments(query);

        res.json({
            success: true,
            archives,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single archived leaderboard details
exports.getArchivedLeaderboard = async (req, res, next) => {
    try {
        const LeaderboardArchive = require('../models/LeaderboardArchive');
        const { archiveId } = req.params;

        const archive = await LeaderboardArchive.findById(archiveId)
            .populate('archivedBy', 'name email')
            .lean();

        if (!archive) {
            return res.status(404).json({
                success: false,
                message: 'Archive not found'
            });
        }

        res.json({
            success: true,
            archive
        });
    } catch (error) {
        next(error);
    }
};

// Clear all leaderboard data (DESTRUCTIVE)
exports.clearAllLeaderboardData = async (req, res, next) => {
    try {
        const { confirmation } = req.body;

        if (confirmation !== 'CLEAR_ALL_LEADERBOARD_DATA') {
            return res.status(400).json({
                success: false,
                message: 'Confirmation text does not match. Please provide: CLEAR_ALL_LEADERBOARD_DATA'
            });
        }

        // Reset all user stats
        await User.updateMany(
            {},
            {
                $set: {
                    totalEarnings: 0,
                    totalKills: 0,
                    matchesPlayed: 0,
                    matchesWon: 0,
                    xp: 0
                }
            }
        );

        res.json({
            success: true,
            message: 'All leaderboard data cleared successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
