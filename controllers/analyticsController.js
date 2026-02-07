const { PlayerStats, User, Match } = require('../models');
const { NotFoundError } = require('../middleware/errorHandler');

// @desc    Get player statistics
// @route   GET /api/analytics/player/:userId
// @access  Private
exports.getPlayerStats = async (req, res, next) => {
    try {
        const { userId } = req.params;

        let stats = await PlayerStats.findOne({ user: userId }).populate('user', 'username avatar gameId');

        if (!stats) {
            // Create initial stats if not found
            stats = await PlayerStats.create({ user: userId });
            await stats.populate('user', 'username avatar gameId');
        }

        // Calculate performance trend
        const trend = stats.getPerformanceTrend();

        res.json({
            success: true,
            data: {
                ...stats.toObject(),
                performanceTrend: trend
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user's statistics
// @route   GET /api/analytics/me
// @access  Private
exports.getMyStats = async (req, res, next) => {
    try {
        let stats = await PlayerStats.findOne({ user: req.user.id }).populate('user', 'username avatar gameId');

        if (!stats) {
            stats = await PlayerStats.create({ user: req.user.id });
            await stats.populate('user', 'username avatar gameId');
        }

        const trend = stats.getPerformanceTrend();

        res.json({
            success: true,
            data: {
                ...stats.toObject(),
                performanceTrend: trend
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get leaderboard by various metrics
// @route   GET /api/analytics/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res, next) => {
    try {
        const { metric = 'skillRating', limit = 100 } = req.query;

        const validMetrics = ['skillRating', 'winRate', 'kdRatio', 'totalWins', 'totalKills'];
        if (!validMetrics.includes(metric)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid metric. Valid options: ' + validMetrics.join(', ')
            });
        }

        const leaderboard = await PlayerStats.find({ totalMatches: { $gte: 5 } })
            .sort({ [metric]: -1 })
            .limit(parseInt(limit))
            .populate('user', 'username avatar gameId country');

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get detailed match statistics
// @route   GET /api/analytics/match/:matchId
// @access  Private
exports.getMatchStatistics = async (req, res, next) => {
    try {
        const { matchId } = req.params;

        const match = await Match.findById(matchId)
            .populate('tournament', 'name gameMode')
            .populate('participants.user', 'username avatar gameId');

        if (!match) {
            throw new NotFoundError('Match not found');
        }

        // Calculate match statistics
        const stats = {
            matchInfo: {
                id: match._id,
                tournament: match.tournament,
                startTime: match.startTime,
                endTime: match.endTime,
                status: match.status
            },
            participants: match.participants.map(p => ({
                user: p.user,
                placement: p.placement,
                kills: p.kills,
                deaths: p.deaths,
                damage: p.damage,
                assists: p.assists,
                score: p.score,
                performance: calculatePerformanceRating(p)
            })),
            aggregates: {
                totalKills: match.participants.reduce((sum, p) => sum + (p.kills || 0), 0),
                totalDamage: match.participants.reduce((sum, p) => sum + (p.damage || 0), 0),
                averageKills: match.participants.reduce((sum, p) => sum + (p.kills || 0), 0) / match.participants.length,
                topPlayer: match.participants.reduce((best, current) =>
                    (current.kills || 0) > (best.kills || 0) ? current : best
                    , match.participants[0])
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get performance comparison
// @route   GET /api/analytics/compare
// @access  Private
exports.getPerformanceComparison = async (req, res, next) => {
    try {
        const { compareWith } = req.query; // comma-separated user IDs or 'global'

        const myStats = await PlayerStats.findOne({ user: req.user.id });

        if (!myStats) {
            throw new NotFoundError('Your statistics not found');
        }

        let comparisonData = {
            me: {
                skillRating: myStats.skillRating,
                winRate: myStats.winRate,
                kdRatio: myStats.kdRatio,
                totalMatches: myStats.totalMatches,
                totalWins: myStats.totalWins
            }
        };

        if (compareWith === 'global') {
            // Compare with global averages
            const globalStats = await PlayerStats.aggregate([
                { $match: { totalMatches: { $gte: 5 } } },
                {
                    $group: {
                        _id: null,
                        avgSkillRating: { $avg: '$skillRating' },
                        avgWinRate: { $avg: '$winRate' },
                        avgKdRatio: { $avg: '$kdRatio' }
                    }
                }
            ]);

            comparisonData.global = globalStats[0] || {};
        } else if (compareWith) {
            // Compare with specific users
            const userIds = compareWith.split(',').slice(0, 5); // Limit to 5 users
            const otherStats = await PlayerStats.find({ user: { $in: userIds } })
                .populate('user', 'username avatar');

            comparisonData.others = otherStats.map(stat => ({
                user: stat.user,
                skillRating: stat.skillRating,
                winRate: stat.winRate,
                kdRatio: stat.kdRatio,
                totalMatches: stat.totalMatches,
                totalWins: stat.totalWins
            }));
        }

        res.json({
            success: true,
            data: comparisonData
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get tournament insights
// @route   GET /api/analytics/tournaments
// @access  Private
exports.getTournamentInsights = async (req, res, next) => {
    try {
        const stats = await PlayerStats.findOne({ user: req.user.id });

        if (!stats) {
            throw new NotFoundError('Statistics not found');
        }

        // Get detailed tournament history
        const matches = await Match.find({
            'participants.user': req.user.id,
            tournament: { $exists: true }
        })
            .populate('tournament', 'name entryFee prizePool')
            .sort({ createdAt: -1 })
            .limit(50);

        const tournamentData = matches.map(match => {
            const participant = match.participants.find(p => p.user.toString() === req.user.id.toString());
            return {
                tournament: match.tournament,
                date: match.createdAt,
                placement: participant.placement,
                kills: participant.kills,
                score: participant.score,
                prize: participant.prize || 0
            };
        });

        res.json({
            success: true,
            data: {
                overall: stats.tournamentStats,
                history: tournamentData,
                averagePlacement: tournamentData.reduce((sum, t) => sum + (t.placement || 0), 0) / tournamentData.length || 0,
                totalPrizeMoney: tournamentData.reduce((sum, t) => sum + (t.prize || 0), 0)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get performance trends over time
// @route   GET /api/analytics/trends
// @access  Private
exports.getPerformanceTrends = async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;

        let daysBack = 30;
        if (period === '7d') daysBack = 7;
        if (period === '90d') daysBack = 90;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        const matches = await Match.find({
            'participants.user': req.user.id,
            createdAt: { $gte: startDate }
        }).sort({ createdAt: 1 });

        const dailyStats = {};

        matches.forEach(match => {
            const date = match.createdAt.toISOString().split('T')[0];
            const participant = match.participants.find(p => p.user.toString() === req.user.id.toString());

            if (!dailyStats[date]) {
                dailyStats[date] = {
                    matches: 0,
                    wins: 0,
                    kills: 0,
                    deaths: 0,
                    damage: 0
                };
            }

            dailyStats[date].matches += 1;
            if (participant.placement === 1) dailyStats[date].wins += 1;
            dailyStats[date].kills += participant.kills || 0;
            dailyStats[date].deaths += participant.deaths || 0;
            dailyStats[date].damage += participant.damage || 0;
        });

        const trends = Object.keys(dailyStats).map(date => ({
            date,
            ...dailyStats[date],
            winRate: (dailyStats[date].wins / dailyStats[date].matches) * 100,
            kdRatio: dailyStats[date].deaths > 0 ? dailyStats[date].kills / dailyStats[date].deaths : dailyStats[date].kills
        }));

        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to calculate performance rating
function calculatePerformanceRating(participant) {
    const killScore = (participant.kills || 0) * 20;
    const assistScore = (participant.assists || 0) * 10;
    const damageScore = (participant.damage || 0) / 100;
    const placementScore = Math.max(0, 100 - (participant.placement || 100) * 2);

    return Math.round(killScore + assistScore + damageScore + placementScore);
}

module.exports = exports;
