const { User, Match, Tournament, Transaction } = require('../models');
const { uploadImage } = require('../config/cloudinary');
const { BadRequestError } = require('../middleware/errorHandler');

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('-otp -deviceFingerprints -password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedUpdates = ['name', 'email', 'dateOfBirth'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Validate age if date of birth is being updated
    if (updates.dateOfBirth) {
      const birthDate = new Date(updates.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        throw new BadRequestError('You must be 18 or older');
      }

      updates.isAgeVerified = true;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-otp -deviceFingerprints -password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

// Update avatar
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('Please upload an image');
    }

    // Upload to Cloudinary
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await uploadImage(base64, 'battlezone/avatars');

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          avatar: {
            url: result.url,
            publicId: result.publicId
          }
        }
      },
      { new: true }
    ).select('avatar');

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (error) {
    next(error);
  }
};

// Update game profiles
exports.updateGameProfiles = async (req, res, next) => {
  try {
    const { pubgMobile, freeFire } = req.body;

    const updates = {};

    if (pubgMobile) {
      updates['gameProfiles.pubgMobile'] = pubgMobile;
    }

    if (freeFire) {
      updates['gameProfiles.freeFire'] = freeFire;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true }
    ).select('gameProfiles');

    res.json({
      success: true,
      message: 'Game profiles updated successfully',
      gameProfiles: user.gameProfiles
    });
  } catch (error) {
    next(error);
  }
};

// Get user stats
exports.getStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('matchesPlayed matchesWon totalEarnings level xp referralCount referralEarnings');

    // Get match stats
    const matchStats = await Match.aggregate([
      {
        $match: {
          'joinedUsers.user': req.user._id,
          status: 'completed'
        }
      },
      {
        $unwind: '$joinedUsers'
      },
      {
        $match: { 'joinedUsers.user': req.user._id }
      },
      {
        $group: {
          _id: null,
          totalMatches: { $sum: 1 },
          totalKills: { $sum: '$joinedUsers.kills' },
          totalPrize: { $sum: '$joinedUsers.prizewon' },
          wins: {
            $sum: {
              $cond: [{ $lte: ['$joinedUsers.position', 3] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stats = matchStats[0] || {
      totalMatches: 0,
      totalKills: 0,
      totalPrize: 0,
      wins: 0
    };

    res.json({
      success: true,
      stats: {
        ...stats,
        level: user.level,
        xp: user.xp,
        matchesPlayed: user.matchesPlayed,
        matchesWon: user.matchesWon,
        totalEarnings: user.totalEarnings,
        referralCount: user.referralCount,
        referralEarnings: user.referralEarnings,
        winRate: stats.totalMatches > 0
          ? ((stats.wins / stats.totalMatches) * 100).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user match history
exports.getMatchHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { 'joinedUsers.user': req.userId };
    if (status) query.status = status;

    const matches = await Match.find(query)
      .select('title gameType matchType entryFee prizePool status scheduledAt joinedUsers')
      .sort({ scheduledAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Match.countDocuments(query);

    // Map to include user's specific data
    const matchHistory = matches.map(match => {
      const userSlot = match.joinedUsers.find(
        ju => ju.user.toString() === req.userId.toString()
      );
      return {
        _id: match._id,
        title: match.title,
        gameType: match.gameType,
        matchType: match.matchType,
        entryFee: match.entryFee,
        prizePool: match.prizePool,
        status: match.status,
        scheduledAt: match.scheduledAt,
        userResult: userSlot ? {
          position: userSlot.position,
          kills: userSlot.kills,
          prizeWon: userSlot.prizewon
        } : null
      };
    });

    res.json({
      success: true,
      matches: matchHistory,
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

// Get user tournament history
exports.getTournamentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { 'participants.user': req.userId };
    if (status) query.status = status;

    const tournaments = await Tournament.find(query)
      .select('title gameType format entryFee prizePool status startAt participants leaderboard')
      .sort({ startAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Tournament.countDocuments(query);

    // Map to include user's specific data
    const tournamentHistory = tournaments.map(tournament => {
      const participant = tournament.participants.find(
        p => p.user.toString() === req.userId.toString()
      );
      const leaderboardEntry = tournament.leaderboard.find(
        l => l.user.toString() === req.userId.toString()
      );

      return {
        _id: tournament._id,
        title: tournament.title,
        gameType: tournament.gameType,
        format: tournament.format,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        status: tournament.status,
        startAt: tournament.startAt,
        userResult: leaderboardEntry ? {
          position: leaderboardEntry.position,
          totalKills: leaderboardEntry.totalKills,
          totalPoints: leaderboardEntry.totalPoints,
          prize: leaderboardEntry.prize
        } : participant ? {
          teamName: participant.teamName,
          isEliminated: participant.isEliminated
        } : null
      };
    });

    res.json({
      success: true,
      tournaments: tournamentHistory,
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

// Get referral info
exports.getReferralInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('referralCode referralCount referralEarnings');

    // Get referred users
    const referredUsers = await User.find({ referredBy: req.userId })
      .select('name createdAt matchesPlayed')
      .sort({ createdAt: -1 })
      .limit(50);

    // Get referral transactions
    const referralTransactions = await Transaction.find({
      user: req.userId,
      category: 'referral_bonus'
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      referral: {
        code: user.referralCode,
        totalReferrals: user.referralCount,
        totalEarnings: user.referralEarnings,
        referredUsers,
        recentEarnings: referralTransactions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get referral statistics (Enhanced)
exports.getReferralStats = async (req, res, next) => {
  try {
    const { ReferralStats } = require('../models');

    let stats = await ReferralStats.findOne({ user: req.userId });

    if (!stats) {
      // Create initial stats
      stats = await ReferralStats.create({ user: req.userId });
    }

    // Get user's referral code
    const user = await User.findById(req.userId).select('referralCode');

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        stats: stats,
        shareable: {
          link: `${process.env.FRONTEND_URL}/register?ref=${user.referralCode}`,
          message: `Join BattleZone using my referral code: ${user.referralCode} and get special bonuses!`
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get referral leaderboard
exports.getReferralLeaderboard = async (req, res, next) => {
  try {
    const { ReferralStats } = require('../models');
    const { limit = 50 } = req.query;

    const leaderboard = await ReferralStats.find()
      .sort({ totalReferrals: -1, totalEarnings: -1 })
      .limit(parseInt(limit))
      .populate('user', 'username avatar');

    // Find current user's rank
    const userStats = await ReferralStats.findOne({ user: req.userId });
    let userRank = null;

    if (userStats) {
      const rank = await ReferralStats.countDocuments({
        $or: [
          { totalReferrals: { $gt: userStats.totalReferrals } },
          {
            totalReferrals: userStats.totalReferrals,
            totalEarnings: { $gt: userStats.totalEarnings }
          }
        ]
      });
      userRank = rank + 1;
    }

    res.json({
      success: true,
      data: {
        leaderboard,
        currentUserRank: userRank,
        currentUserStats: userStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get notification preferences
exports.getNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('notificationPreferences pushSubscription');

    res.json({
      success: true,
      preferences: user.notificationPreferences,
      hasPushSubscription: !!user.pushSubscription?.endpoint
    });
  } catch (error) {
    next(error);
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const { matchReminders, roomCredentials, withdrawalUpdates, promotions } = req.body;

    const updates = {};

    if (matchReminders !== undefined) updates['notificationPreferences.matchReminders'] = matchReminders;
    if (roomCredentials !== undefined) updates['notificationPreferences.roomCredentials'] = roomCredentials;
    if (withdrawalUpdates !== undefined) updates['notificationPreferences.withdrawalUpdates'] = withdrawalUpdates;
    if (promotions !== undefined) updates['notificationPreferences.promotions'] = promotions;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true }
    ).select('notificationPreferences');

    res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    next(error);
  }
};

// Update push subscription
exports.updatePushSubscription = async (req, res, next) => {
  try {
    const { subscription } = req.body;

    await User.findByIdAndUpdate(req.userId, {
      $set: { pushSubscription: subscription }
    });

    res.json({
      success: true,
      message: 'Push subscription updated'
    });
  } catch (error) {
    next(error);
  }
};

// Remove push subscription
exports.removePushSubscription = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: { pushSubscription: 1 }
    });

    res.json({
      success: true,
      message: 'Push subscription removed'
    });
  } catch (error) {
    next(error);
  }
};

// Search users (for team invites, etc.)
exports.searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        users: []
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.userId } }, // Exclude self
        { isBanned: false, isActive: true },
        {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { 'gameProfiles.pubgMobile.inGameName': { $regex: q, $options: 'i' } },
            { 'gameProfiles.freeFire.inGameName': { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
      .select('name avatar level gameProfiles')
      .limit(20);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};
