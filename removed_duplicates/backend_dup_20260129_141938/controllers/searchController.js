const { Match, Tournament, User } = require('../models');

// Global search
exports.search = async (req, res, next) => {
    try {
        const { q, type = 'all', limit = 10 } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                results: {
                    matches: [],
                    tournaments: [],
                    players: []
                }
            });
        }

        const searchRegex = new RegExp(q, 'i');
        const results = {};

        // Search matches
        if (type === 'all' || type === 'matches') {
            results.matches = await Match.find({
                $and: [
                    {
                        $or: [
                            { title: searchRegex },
                            { tags: searchRegex }
                        ]
                    },
                    { status: { $in: ['upcoming', 'registration_open', 'live'] } }
                ]
            })
                .select('title gameType matchType entryFee prizePool status scheduledAt filledSlots maxSlots')
                .sort({ scheduledAt: 1 })
                .limit(parseInt(limit))
                .lean();
        }

        // Search tournaments
        if (type === 'all' || type === 'tournaments') {
            results.tournaments = await Tournament.find({
                $and: [
                    { title: searchRegex },
                    { status: { $in: ['upcoming', 'registration_open', 'ongoing'] } }
                ]
            })
                .select('title gameType format entryFee prizePool status startAt registeredTeams maxTeams')
                .sort({ startAt: 1 })
                .limit(parseInt(limit))
                .lean();
        }

        // Search players
        if (type === 'all' || type === 'players') {
            results.players = await User.find({
                $and: [
                    {
                        $or: [
                            { name: searchRegex },
                            { 'gameProfiles.pubgMobile.inGameName': searchRegex },
                            { 'gameProfiles.freeFire.inGameName': searchRegex }
                        ]
                    },
                    { isBanned: false, isActive: true }
                ]
            })
                .select('name avatar level matchesPlayed matchesWon totalEarnings')
                .sort({ totalEarnings: -1 })
                .limit(parseInt(limit))
                .lean();
        }

        // Add result counts
        const counts = {
            matches: results.matches?.length || 0,
            tournaments: results.tournaments?.length || 0,
            players: results.players?.length || 0,
            total: (results.matches?.length || 0) + (results.tournaments?.length || 0) + (results.players?.length || 0)
        };

        res.json({
            success: true,
            query: q,
            counts,
            results
        });
    } catch (error) {
        next(error);
    }
};

// Search matches only
exports.searchMatches = async (req, res, next) => {
    try {
        const { q, status, gameType, page = 1, limit = 20 } = req.query;

        const query = {};

        if (q && q.length >= 2) {
            query.$or = [
                { title: new RegExp(q, 'i') },
                { tags: new RegExp(q, 'i') }
            ];
        }

        if (status) {
            query.status = { $in: status.split(',') };
        }

        if (gameType) {
            query.gameType = gameType;
        }

        const matches = await Match.find(query)
            .select('title gameType matchType entryFee prizePool status scheduledAt filledSlots maxSlots isChallenge')
            .sort({ scheduledAt: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Match.countDocuments(query);

        res.json({
            success: true,
            matches,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Search tournaments only
exports.searchTournaments = async (req, res, next) => {
    try {
        const { q, status, gameType, page = 1, limit = 20 } = req.query;

        const query = {};

        if (q && q.length >= 2) {
            query.title = new RegExp(q, 'i');
        }

        if (status) {
            query.status = { $in: status.split(',') };
        }

        if (gameType) {
            query.gameType = gameType;
        }

        const tournaments = await Tournament.find(query)
            .select('title gameType format entryFee prizePool status startAt registeredTeams maxTeams')
            .sort({ startAt: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Tournament.countDocuments(query);

        res.json({
            success: true,
            tournaments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Search players only
exports.searchPlayers = async (req, res, next) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                players: [],
                pagination: { page: 1, limit: 20, total: 0, pages: 0 }
            });
        }

        const query = {
            $and: [
                {
                    $or: [
                        { name: new RegExp(q, 'i') },
                        { 'gameProfiles.pubgMobile.inGameName': new RegExp(q, 'i') },
                        { 'gameProfiles.freeFire.inGameName': new RegExp(q, 'i') }
                    ]
                },
                { isBanned: false, isActive: true }
            ]
        };

        const players = await User.find(query)
            .select('name avatar level matchesPlayed matchesWon totalEarnings')
            .sort({ totalEarnings: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            players,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};
