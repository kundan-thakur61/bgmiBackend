const { Tournament, User, Transaction, Notification, AdminLog } = require('../models');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

// Get all tournaments
exports.getTournaments = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      gameType, 
      status = 'upcoming,registration_open',
      sortBy = 'startAt'
    } = req.query;
    
    const query = {};
    if (gameType) query.gameType = gameType;
    if (status) query.status = { $in: status.split(',') };
    
    const tournaments = await Tournament.find(query)
      .select('-participants')
      .sort({ [sortBy]: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name');
    
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

// Get featured tournaments
exports.getFeaturedTournaments = async (req, res, next) => {
  try {
    const tournaments = await Tournament.find({
      isFeatured: true,
      status: { $in: ['upcoming', 'registration_open', 'ongoing'] }
    })
      .select('title gameType format mode entryFee prizePool maxTeams registeredTeams startAt banner status')
      .sort({ startAt: 1 })
      .limit(5);
    
    res.json({
      success: true,
      tournaments
    });
  } catch (error) {
    next(error);
  }
};

// Get single tournament
exports.getTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('participants.user', 'name avatar level');
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    let userRegistered = false;
    let userParticipant = null;
    
    if (req.userId) {
      const participant = tournament.getParticipant(req.userId);
      if (participant) {
        userRegistered = true;
        userParticipant = {
          teamName: participant.teamName,
          slotNumber: participant.slotNumber,
          currentRound: participant.currentRound,
          isEliminated: participant.isEliminated,
          totalKills: participant.totalKills,
          totalPoints: participant.totalPoints
        };
      }
    }
    
    res.json({
      success: true,
      tournament,
      userRegistered,
      userParticipant
    });
  } catch (error) {
    next(error);
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .select('title leaderboard prizeDistribution')
      .populate('leaderboard.user', 'name avatar level');
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    res.json({
      success: true,
      title: tournament.title,
      leaderboard: tournament.leaderboard,
      prizeDistribution: tournament.prizeDistribution
    });
  } catch (error) {
    next(error);
  }
};

// Register for tournament
exports.registerForTournament = async (req, res, next) => {
  try {
    const { teamName, teamMembers } = req.body;
    
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    const joinable = tournament.isJoinable();
    if (!joinable.joinable) {
      throw new BadRequestError(joinable.reason);
    }
    
    if (tournament.hasUserJoined(req.userId)) {
      throw new BadRequestError('You are already registered');
    }
    
    // Check user level
    const user = await User.findById(req.userId);
    const levelOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    
    if (levelOrder.indexOf(user.level) < levelOrder.indexOf(tournament.minLevelRequired)) {
      throw new ForbiddenError(`Minimum ${tournament.minLevelRequired} level required`);
    }
    
    // Check balance
    if (user.walletBalance < tournament.entryFee) {
      throw new BadRequestError('Insufficient wallet balance');
    }
    
    // Validate team members for duo/squad
    if (tournament.mode !== 'solo') {
      const requiredMembers = tournament.mode === 'duo' ? 2 : 4;
      if (!teamMembers || teamMembers.length < requiredMembers) {
        throw new BadRequestError(`${requiredMembers} team members required for ${tournament.mode} mode`);
      }
    }
    
    // Deduct entry fee
    await Transaction.createTransaction({
      user: req.userId,
      type: 'debit',
      category: 'tournament_entry',
      amount: tournament.entryFee,
      description: `Entry fee for tournament: ${tournament.title}`,
      reference: { type: 'tournament', id: tournament._id }
    });
    
    // Add participant
    const slotNumber = tournament.addParticipant(
      req.userId,
      teamName || user.name,
      teamMembers || []
    );
    
    await tournament.save();
    
    res.json({
      success: true,
      message: 'Successfully registered for tournament',
      slotNumber,
      tournament: {
        id: tournament._id,
        title: tournament.title,
        startAt: tournament.startAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Leave tournament
exports.leaveTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    const participant = tournament.getParticipant(req.userId);
    
    if (!participant) {
      throw new BadRequestError('You are not registered for this tournament');
    }
    
    if (!['upcoming', 'registration_open'].includes(tournament.status)) {
      throw new BadRequestError('Cannot leave after registration closes');
    }
    
    // Remove participant
    tournament.participants = tournament.participants.filter(
      p => p.user.toString() !== req.userId.toString()
    );
    tournament.registeredTeams -= 1;
    await tournament.save();
    
    // Refund with 10% cancellation fee
    const refundAmount = Math.floor(tournament.entryFee * 0.9);
    await Transaction.createTransaction({
      user: req.userId,
      type: 'credit',
      category: 'tournament_refund',
      amount: refundAmount,
      description: `Refund for leaving tournament: ${tournament.title}`,
      reference: { type: 'tournament', id: tournament._id }
    });
    
    res.json({
      success: true,
      message: 'Left tournament successfully',
      refundAmount
    });
  } catch (error) {
    next(error);
  }
};

// Get my tournament status
exports.getMyTournamentStatus = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    const participant = tournament.getParticipant(req.userId);
    
    if (!participant) {
      return res.json({
        success: true,
        registered: false
      });
    }
    
    const leaderboardPosition = tournament.leaderboard.findIndex(
      l => l.user.toString() === req.userId.toString()
    );
    
    res.json({
      success: true,
      registered: true,
      participant: {
        teamName: participant.teamName,
        teamMembers: participant.teamMembers,
        slotNumber: participant.slotNumber,
        currentRound: participant.currentRound,
        isEliminated: participant.isEliminated,
        totalKills: participant.totalKills,
        totalPoints: participant.totalPoints,
        matchesPlayed: participant.matchesPlayed,
        leaderboardPosition: leaderboardPosition >= 0 ? leaderboardPosition + 1 : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create tournament
exports.createTournament = async (req, res, next) => {
  try {
    const tournamentData = {
      ...req.body,
      createdBy: req.userId,
      status: req.body.status || 'draft'
    };
    
    const tournament = await Tournament.create(tournamentData);
    
    await AdminLog.log({
      admin: req.userId,
      action: 'tournament_create',
      targetType: 'tournament',
      targetId: tournament._id,
      description: `Created tournament: ${tournament.title}`,
      ip: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      tournament
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update tournament
exports.updateTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    if (['completed', 'cancelled'].includes(tournament.status)) {
      throw new BadRequestError('Cannot update completed or cancelled tournament');
    }
    
    const allowedUpdates = [
      'title', 'description', 'entryFee', 'prizePool', 'prizeDistribution',
      'maxTeams', 'registrationStartAt', 'registrationEndAt', 'startAt',
      'rules', 'requirements', 'minLevelRequired', 'isFeatured', 'sponsor',
      'banner', 'thumbnail', 'streamUrl', 'pointSystem', 'status'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        tournament[field] = req.body[field];
      }
    });
    
    await tournament.save();
    
    res.json({
      success: true,
      message: 'Tournament updated successfully',
      tournament
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete tournament
exports.deleteTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    if (tournament.registeredTeams > 0) {
      throw new BadRequestError('Cannot delete tournament with participants');
    }
    
    await tournament.deleteOne();
    
    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update standings
exports.updateStandings = async (req, res, next) => {
  try {
    const { results } = req.body; // Array of { userId, kills, points }
    
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    // Update participant stats
    for (const result of results) {
      const participant = tournament.participants.find(
        p => p.user.toString() === result.userId
      );
      
      if (participant) {
        participant.totalKills += result.kills || 0;
        participant.totalPoints += result.points || 0;
        participant.matchesPlayed += 1;
        
        if (result.isEliminated) {
          participant.isEliminated = true;
          participant.eliminatedInRound = result.round;
        }
      }
    }
    
    // Update leaderboard
    tournament.updateLeaderboard();
    
    await tournament.save();
    
    res.json({
      success: true,
      message: 'Standings updated successfully',
      leaderboard: tournament.leaderboard.slice(0, 10)
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Complete tournament
exports.completeTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    // Distribute prizes
    for (const entry of tournament.leaderboard) {
      if (entry.prize > 0 && !entry.prizeDistributed) {
        await Transaction.createTransaction({
          user: entry.user,
          type: 'credit',
          category: 'tournament_prize',
          amount: entry.prize,
          description: `Prize for ${tournament.title} - Position: ${entry.position}`,
          reference: { type: 'tournament', id: tournament._id }
        });
        
        entry.prizeDistributed = true;
        
        // Update user stats
        const user = await User.findById(entry.user);
        user.totalEarnings += entry.prize;
        user.addXP(200 + entry.totalKills * 10);
        await user.save();
        
        // Notify
        await Notification.createAndPush({
          user: entry.user,
          type: 'tournament_prize',
          title: 'Tournament Prize!',
          message: `Congratulations! You won ₹${entry.prize} in ${tournament.title}`,
          reference: { type: 'tournament', id: tournament._id },
          priority: 'high'
        });
      }
    }
    
    tournament.status = 'completed';
    tournament.endAt = new Date();
    await tournament.save();
    
    res.json({
      success: true,
      message: 'Tournament completed and prizes distributed'
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Cancel tournament
exports.cancelTournament = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      throw new NotFoundError('Tournament not found');
    }
    
    // Refund all participants
    for (const participant of tournament.participants) {
      await Transaction.createTransaction({
        user: participant.user,
        type: 'credit',
        category: 'tournament_refund',
        amount: tournament.entryFee,
        description: `Refund for cancelled tournament: ${tournament.title}`,
        reference: { type: 'tournament', id: tournament._id }
      });
      
      await Notification.createAndPush({
        user: participant.user,
        type: 'tournament_cancelled',
        title: 'Tournament Cancelled',
        message: `Tournament "${tournament.title}" has been cancelled. Entry fee refunded.`,
        reference: { type: 'tournament', id: tournament._id }
      });
    }
    
    tournament.status = 'cancelled';
    tournament.cancelledAt = new Date();
    tournament.cancelledBy = req.userId;
    tournament.cancellationReason = reason;
    tournament.refundsProcessed = true;
    await tournament.save();
    
    await AdminLog.log({
      admin: req.userId,
      action: 'tournament_cancel',
      targetType: 'tournament',
      targetId: tournament._id,
      description: `Cancelled tournament: ${tournament.title}`,
      ip: req.ip,
      severity: 'high'
    });
    
    res.json({
      success: true,
      message: 'Tournament cancelled and participants refunded'
    });
  } catch (error) {
    next(error);
  }
};
