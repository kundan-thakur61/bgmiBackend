const { Mission, UserProgress, User, Wallet } = require('../models');
const { NotFoundError, BadRequestError } = require('../middleware/errorHandler');

// @desc    Get available missions
// @route   GET /api/gamification/missions
// @access  Private
exports.getMissions = async (req, res, next) => {
    try {
        const { type = 'daily' } = req.query;

        const now = new Date();

        const missions = await Mission.find({
            type,
            isActive: true,
            $or: [
                { startDate: { $exists: false } },
                { startDate: { $lte: now }, endDate: { $gte: now } }
            ]
        }).sort({ order: 1, difficulty: 1 });

        // Get user's progress for these missions
        const userProgress = await UserProgress.findOne({ user: req.user.id });

        const missionsWithProgress = missions.map(mission => {
            const progress = userProgress?.missionProgress.find(
                p => p.mission.toString() === mission._id.toString()
            );

            return {
                ...mission.toObject(),
                userProgress: progress ? {
                    progress: progress.progress,
                    status: progress.status,
                    startedAt: progress.startedAt,
                    completedAt: progress.completedAt
                } : null
            };
        });

        res.json({
            success: true,
            count: missionsWithProgress.length,
            data: missionsWithProgress
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Start a mission
// @route   POST /api/gamification/missions/:missionId/start
// @access  Private
exports.startMission = async (req, res, next) => {
    try {
        const { missionId } = req.params;

        const mission = await Mission.findById(missionId);

        if (!mission) {
            throw new NotFoundError('Mission not found');
        }

        let userProgress = await UserProgress.findOne({ user: req.user.id });

        if (!userProgress) {
            userProgress = await UserProgress.create({ user: req.user.id });
        }

        // Check if mission already started
        const existingProgress = userProgress.missionProgress.find(
            p => p.mission.toString() === missionId
        );

        if (existingProgress) {
            throw new BadRequestError('Mission already started');
        }

        // Add mission to progress
        userProgress.missionProgress.push({
            mission: missionId,
            progress: 0,
            target: mission.requirement.target,
            status: 'in_progress',
            startedAt: new Date()
        });

        await userProgress.save();

        res.json({
            success: true,
            message: 'Mission started',
            data: userProgress
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update mission progress
// @route   PUT /api/gamification/missions/:missionId/progress
// @access  Private
exports.updateMissionProgress = async (req, res, next) => {
    try {
        const { missionId } = req.params;
        const { progress } = req.body;

        const userProgress = await UserProgress.findOne({ user: req.user.id });

        if (!userProgress) {
            throw new NotFoundError('User progress not found');
        }

        userProgress.updateMissionProgress(missionId, progress);
        await userProgress.save();

        res.json({
            success: true,
            message: 'Progress updated',
            data: userProgress
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Claim mission reward
// @route   POST /api/gamification/missions/:missionId/claim
// @access  Private
exports.claimMissionReward = async (req, res, next) => {
    try {
        const { missionId } = req.params;

        const mission = await Mission.findById(missionId);

        if (!mission) {
            throw new NotFoundError('Mission not found');
        }

        const userProgress = await UserProgress.findOne({ user: req.user.id });

        if (!userProgress) {
            throw new NotFoundError('User progress not found');
        }

        const claimed = userProgress.claimMissionReward(missionId);

        if (!claimed) {
            throw new BadRequestError('Mission not completed or already claimed');
        }

        // Add XP reward
        if (mission.rewards.xp) {
            userProgress.addXP(mission.rewards.xp);
        }

        // Add coin reward to wallet
        if (mission.rewards.coins) {
            const wallet = await Wallet.findOne({ user: req.user.id });
            if (wallet) {
                wallet.addFunds(mission.rewards.coins, 'Mission Reward: ' + mission.title);
                await wallet.save();
            }
        }

        await userProgress.save();

        res.json({
            success: true,
            message: 'Reward claimed successfully',
            data: {
                rewards: mission.rewards,
                newLevel: userProgress.level,
                currentXP: userProgress.currentXP
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user progress
// @route   GET /api/gamification/progress
// @access  Private
exports.getUserProgress = async (req, res, next) => {
    try {
        let userProgress = await UserProgress.findOne({ user: req.user.id })
            .populate('missionProgress.mission');

        if (!userProgress) {
            userProgress = await UserProgress.create({ user: req.user.id });
        }

        // Update login streak
        userProgress.updateLoginStreak();
        await userProgress.save();

        res.json({
            success: true,
            data: userProgress
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get seasonal pass
// @route   GET /api/gamification/season-pass
// @access  Private
exports.getSeasonPass = async (req, res, next) => {
    try {
        const { SeasonalPass } = require('../models');

        // Get current active season
        const currentSeason = await SeasonalPass.findOne({
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!currentSeason) {
            return res.json({
                success: true,
                message: 'No active season',
                data: null
            });
        }

        // Get user progress
        const userProgress = await UserProgress.findOne({ user: req.user.id });

        res.json({
            success: true,
            data: {
                season: currentSeason,
                userProgress: userProgress?.seasonPass || {
                    season: currentSeason.season,
                    tier: 0,
                    xp: 0,
                    isPremium: false,
                    claimedRewards: []
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Claim season pass reward
// @route   POST /api/gamification/season-pass/claim/:tier
// @access  Private
exports.claimSeasonReward = async (req, res, next) => {
    try {
        const { tier } = req.params;
        const { SeasonalPass } = require('../models');

        const currentSeason = await SeasonalPass.findOne({
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!currentSeason) {
            throw new NotFoundError('No active season');
        }

        const userProgress = await UserProgress.findOne({ user: req.user.id });

        if (!userProgress) {
            throw new NotFoundError('User progress not found');
        }

        // Check if user has reached this tier
        if (userProgress.seasonPass.tier < parseInt(tier)) {
            throw new BadRequestError('Tier not unlocked yet');
        }

        // Check if already claimed
        if (userProgress.seasonPass.claimedRewards.includes(parseInt(tier))) {
            throw new BadRequestError('Reward already claimed');
        }

        // Add to claimed rewards
        userProgress.seasonPass.claimedRewards.push(parseInt(tier));
        await userProgress.save();

        // Get reward details
        const tierData = currentSeason.tiers.find(t => t.tier === parseInt(tier));

        res.json({
            success: true,
            message: 'Reward claimed',
            data: {
                tier: parseInt(tier),
                reward: userProgress.seasonPass.isPremium ? tierData.premiumReward : tierData.freeReward
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Purchase premium season pass
// @route   POST /api/gamification/season-pass/purchase
// @access  Private
exports.purchaseSeasonPass = async (req, res, next) => {
    try {
        const { SeasonalPass } = require('../models');

        const currentSeason = await SeasonalPass.findOne({
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!currentSeason) {
            throw new NotFoundError('No active season');
        }

        const userProgress = await UserProgress.findOne({ user: req.user.id });

        if (!userProgress) {
            throw new NotFoundError('User progress not found');
        }

        if (userProgress.seasonPass.isPremium) {
            throw new BadRequestError('You already own the premium pass');
        }

        // Check wallet balance
        const wallet = await Wallet.findOne({ user: req.user.id });

        if (!wallet || wallet.balance < currentSeason.premiumPrice) {
            throw new BadRequestError('Insufficient balance');
        }

        // Deduct from wallet
        wallet.deductFunds(currentSeason.premiumPrice, 'Season Pass Purchase');
        await wallet.save();

        // Upgrade to premium
        userProgress.seasonPass.isPremium = true;
        await userProgress.save();

        // Update season stats
        currentSeason.stats.premiumUsers += 1;
        currentSeason.stats.revenueGenerated += currentSeason.premiumPrice;
        await currentSeason.save();

        res.json({
            success: true,
            message: 'Premium season pass purchased successfully',
            data: userProgress.seasonPass
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get leaderboard for levels
// @route   GET /api/gamification/leaderboard
// @access  Public
exports.getLevelLeaderboard = async (req, res, next) => {
    try {
        const { limit = 100 } = req.query;

        const leaderboard = await UserProgress.find()
            .sort({ level: -1, currentXP: -1 })
            .limit(parseInt(limit))
            .populate('user', 'username avatar gameId country');

        res.json({
            success: true,
            count: leaderboard.length,
            data: leaderboard
        });
    } catch (error) {
        next(error);
    }
};

module.exports = exports;
