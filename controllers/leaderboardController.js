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
