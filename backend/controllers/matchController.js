const { Match, User, Transaction, Notification, ScreenshotHash, AdminLog } = require('../models');
const { uploadScreenshot } = require('../config/cloudinary');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const crypto = require('crypto');

// Get all matches with filters
exports.getMatches = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      gameType, 
      matchType, 
      status = 'upcoming,registration_open',
      sortBy = 'scheduledAt',
      sortOrder = 'asc'
    } = req.query;
    
    const query = {};
    
    if (gameType) query.gameType = gameType;
    if (matchType) query.matchType = matchType;
    if (status) query.status = { $in: status.split(',') };
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const matches = await Match.find(query)
      .select('-roomId -roomPassword -joinedUsers.screenshot')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name')
      .populate('host', 'name isVerifiedHost');
    
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

// Get upcoming matches
exports.getUpcomingMatches = async (req, res, next) => {
  try {
    const { limit = 10, gameType } = req.query;
    
    const query = {
      status: { $in: ['upcoming', 'registration_open'] },
      scheduledAt: { $gt: new Date() }
    };
    
    if (gameType) query.gameType = gameType;
    
    const matches = await Match.find(query)
      .select('title gameType matchType mode entryFee prizePool maxSlots filledSlots scheduledAt isFeatured sponsor')
      .sort({ scheduledAt: 1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      matches
    });
  } catch (error) {
    next(error);
  }
};

// Get live matches
exports.getLiveMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: 'live' })
      .select('title gameType matchType mode prizePool filledSlots scheduledAt streamUrl status')
      .sort({ scheduledAt: -1 });
    
    res.json({
      success: true,
      matches
    });
  } catch (error) {
    next(error);
  }
};

// Get single match
exports.getMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .select('-roomId -roomPassword')
      .populate('createdBy', 'name')
      .populate('host', 'name isVerifiedHost avatar')
      .populate('joinedUsers.user', 'name avatar level');
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    // Check if current user has joined
    let userJoined = false;
    let userSlot = null;
    
    if (req.userId) {
      const slot = match.getUserSlot(req.userId);
      if (slot) {
        userJoined = true;
        userSlot = {
          slotNumber: slot.slotNumber,
          inGameName: slot.inGameName,
          screenshotStatus: slot.screenshotStatus
        };
      }
    }
    
    res.json({
      success: true,
      match,
      userJoined,
      userSlot
    });
  } catch (error) {
    next(error);
  }
};

// Join match
exports.joinMatch = async (req, res, next) => {
  try {
    const { inGameId, inGameName } = req.body;
    
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    // Check if match is joinable
    const joinable = match.isJoinable();
    if (!joinable.joinable) {
      throw new BadRequestError(joinable.reason);
    }
    
    // Check if user already joined
    if (match.hasUserJoined(req.userId)) {
      throw new BadRequestError('You have already joined this match');
    }
    
    // Check user level requirement
    const user = await User.findById(req.userId);
    const levelOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    
    if (levelOrder.indexOf(user.level) < levelOrder.indexOf(match.minLevelRequired)) {
      throw new ForbiddenError(`Minimum ${match.minLevelRequired} level required for this match`);
    }
    
    // Check wallet balance
    if (user.walletBalance < match.entryFee) {
      throw new BadRequestError('Insufficient wallet balance');
    }
    
    // Deduct entry fee
    await Transaction.createTransaction({
      user: req.userId,
      type: 'debit',
      category: 'match_entry',
      amount: match.entryFee,
      description: `Entry fee for match: ${match.title}`,
      reference: { type: 'match', id: match._id },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Add user to match
    const slotNumber = match.addUser(req.userId, inGameName, inGameId);
    await match.save();
    
    // Handle referral commission (5% of entry fee)
    if (user.referredBy) {
      const referralCommission = Math.floor(match.entryFee * 0.05);
      if (referralCommission > 0) {
        const referrer = await User.findById(user.referredBy);
        if (referrer && !referrer.isBanned) {
          await Transaction.createTransaction({
            user: referrer._id,
            type: 'credit',
            category: 'referral_bonus',
            amount: referralCommission,
            description: `Referral commission from ${user.name}'s match entry`,
            reference: { type: 'referral', id: user._id }
          });
          
          referrer.referralEarnings += referralCommission;
          await referrer.save();
        }
      }
    }
    
    // Emit socket event for real-time slot update
    const io = req.app.get('io');
    io.to(`match_${match._id}`).emit('slot_update', {
      matchId: match._id,
      filledSlots: match.filledSlots,
      maxSlots: match.maxSlots
    });
    
    res.json({
      success: true,
      message: 'Successfully joined the match',
      slotNumber,
      match: {
        id: match._id,
        title: match.title,
        scheduledAt: match.scheduledAt,
        filledSlots: match.filledSlots,
        maxSlots: match.maxSlots
      }
    });
  } catch (error) {
    next(error);
  }
};

// Leave match
exports.leaveMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    if (!match.hasUserJoined(req.userId)) {
      throw new BadRequestError('You have not joined this match');
    }
    
    // Check if match can be left (only before registration closes)
    if (!['upcoming', 'registration_open'].includes(match.status)) {
      throw new BadRequestError('Cannot leave match after registration closes');
    }
    
    // Check time - must leave at least 1 hour before match
    const timeUntilMatch = new Date(match.scheduledAt) - new Date();
    if (timeUntilMatch < 60 * 60 * 1000) {
      throw new BadRequestError('Cannot leave match less than 1 hour before start time');
    }
    
    // Remove user
    match.removeUser(req.userId);
    await match.save();
    
    // Refund entry fee (with 10% cancellation charge)
    const refundAmount = Math.floor(match.entryFee * 0.9);
    await Transaction.createTransaction({
      user: req.userId,
      type: 'credit',
      category: 'match_refund',
      amount: refundAmount,
      description: `Refund for leaving match: ${match.title} (10% cancellation fee applied)`,
      reference: { type: 'match', id: match._id }
    });
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`match_${match._id}`).emit('slot_update', {
      matchId: match._id,
      filledSlots: match.filledSlots,
      maxSlots: match.maxSlots
    });
    
    res.json({
      success: true,
      message: 'Successfully left the match',
      refundAmount
    });
  } catch (error) {
    next(error);
  }
};

// Get room credentials
exports.getRoomCredentials = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).select('+roomId +roomPassword');
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    if (!match.hasUserJoined(req.userId)) {
      throw new ForbiddenError('You have not joined this match');
    }
    
    if (!match.roomCredentialsVisible) {
      throw new BadRequestError('Room credentials are not available yet');
    }
    
    res.json({
      success: true,
      roomId: match.roomId,
      roomPassword: match.roomPassword,
      scheduledAt: match.scheduledAt
    });
  } catch (error) {
    next(error);
  }
};

// Upload screenshot
exports.uploadScreenshot = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('Please upload a screenshot');
    }
    
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    const userSlot = match.getUserSlot(req.userId);
    
    if (!userSlot) {
      throw new ForbiddenError('You have not joined this match');
    }
    
    if (!['live', 'completed', 'result_pending'].includes(match.status)) {
      throw new BadRequestError('Screenshots can only be uploaded after match starts');
    }
    
    if (userSlot.screenshotStatus === 'verified') {
      throw new BadRequestError('Your screenshot has already been verified');
    }
    
    // Generate image hash for duplicate detection
    const imageHash = crypto
      .createHash('md5')
      .update(req.file.buffer)
      .digest('hex');
    
    // Check for duplicate
    const duplicateCheck = await ScreenshotHash.checkDuplicate(imageHash, req.userId, match._id);
    
    if (duplicateCheck.isDuplicate) {
      // Flag the screenshot
      await ScreenshotHash.create({
        hash: imageHash,
        user: req.userId,
        match: match._id,
        isDuplicate: true,
        duplicateOf: duplicateCheck.originalId,
        status: 'flagged',
        flagReason: 'Duplicate screenshot detected'
      });
      
      // Update user slot
      userSlot.screenshotStatus = 'flagged';
      userSlot.screenshotRejectionReason = 'Duplicate screenshot detected';
      await match.save();
      
      throw new BadRequestError('This screenshot has already been uploaded. Duplicate screenshots are not allowed.');
    }
    
    // Upload to Cloudinary
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploadResult = await uploadScreenshot(base64, match._id, req.userId);
    
    // Store hash
    await ScreenshotHash.create({
      hash: imageHash,
      user: req.userId,
      match: match._id,
      imageUrl: uploadResult.url,
      status: 'pending'
    });
    
    // Update user slot
    userSlot.screenshot = {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      uploadedAt: new Date(),
      hash: imageHash
    };
    userSlot.screenshotStatus = 'pending';
    
    await match.save();
    
    res.json({
      success: true,
      message: 'Screenshot uploaded successfully',
      screenshot: {
        url: uploadResult.url,
        status: 'pending'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get my match status
exports.getMyMatchStatus = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .select('+roomId +roomPassword');
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    const userSlot = match.getUserSlot(req.userId);
    
    if (!userSlot) {
      return res.json({
        success: true,
        joined: false
      });
    }
    
    const response = {
      success: true,
      joined: true,
      slotNumber: userSlot.slotNumber,
      inGameName: userSlot.inGameName,
      screenshot: userSlot.screenshot,
      screenshotStatus: userSlot.screenshotStatus,
      result: userSlot.position ? {
        position: userSlot.position,
        kills: userSlot.kills,
        prize: userSlot.prizewon
      } : null
    };
    
    // Include room credentials if visible
    if (match.roomCredentialsVisible) {
      response.roomId = match.roomId;
      response.roomPassword = match.roomPassword;
    }
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Admin: Create match
exports.createMatch = async (req, res, next) => {
  try {
    const matchData = {
      ...req.body,
      createdBy: req.userId
    };
    
    // Set default prize distribution if not provided
    if (!matchData.prizeDistribution || matchData.prizeDistribution.length === 0) {
      matchData.prizeDistribution = [
        { position: 1, prize: Math.floor(matchData.prizePool * 0.5), label: '1st Place' },
        { position: 2, prize: Math.floor(matchData.prizePool * 0.3), label: '2nd Place' },
        { position: 3, prize: Math.floor(matchData.prizePool * 0.2), label: '3rd Place' }
      ];
    }
    
    const match = await Match.create(matchData);
    
    // Log admin action
    await AdminLog.log({
      admin: req.userId,
      action: 'match_create',
      targetType: 'match',
      targetId: match._id,
      description: `Created match: ${match.title}`,
      newData: matchData,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      match
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update match
exports.updateMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    // Don't allow updating completed or cancelled matches
    if (['completed', 'cancelled'].includes(match.status)) {
      throw new BadRequestError('Cannot update completed or cancelled matches');
    }
    
    const previousData = match.toObject();
    
    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'entryFee', 'prizePool', 'prizeDistribution',
      'perKillPrize', 'maxSlots', 'scheduledAt', 'map', 'rules', 
      'minLevelRequired', 'isFeatured', 'sponsor', 'streamUrl'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        match[field] = req.body[field];
      }
    });
    
    await match.save();
    
    // Log admin action
    await AdminLog.log({
      admin: req.userId,
      action: 'match_update',
      targetType: 'match',
      targetId: match._id,
      description: `Updated match: ${match.title}`,
      previousData,
      newData: req.body,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: 'Match updated successfully',
      match
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete match
exports.deleteMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    if (match.filledSlots > 0) {
      throw new BadRequestError('Cannot delete match with participants. Cancel it instead.');
    }
    
    await match.deleteOne();
    
    await AdminLog.log({
      admin: req.userId,
      action: 'match_cancel',
      targetType: 'match',
      targetId: req.params.id,
      description: `Deleted match: ${match.title}`,
      ip: req.ip,
      severity: 'high'
    });
    
    res.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Set room credentials
exports.setRoomCredentials = async (req, res, next) => {
  try {
    const { roomId, roomPassword, revealNow } = req.body;
    
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    match.roomId = roomId;
    match.roomPassword = roomPassword;
    
    if (revealNow) {
      match.roomCredentialsVisible = true;
      match.status = 'room_revealed';
      
      // Notify all participants
      await Notification.notifyRoomReleased(match);
      
      // Emit socket event
      const io = req.app.get('io');
      io.to(`match_${match._id}`).emit('room_revealed', {
        matchId: match._id,
        roomId,
        roomPassword
      });
    }
    
    await match.save();
    
    res.json({
      success: true,
      message: revealNow ? 'Room credentials set and revealed' : 'Room credentials set',
      roomCredentialsVisible: match.roomCredentialsVisible
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Start match
exports.startMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    if (!['room_revealed', 'registration_closed'].includes(match.status)) {
      throw new BadRequestError('Match must have room credentials revealed first');
    }
    
    match.status = 'live';
    await match.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`match_${match._id}`).emit('match_started', { matchId: match._id });
    
    res.json({
      success: true,
      message: 'Match started',
      status: match.status
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Complete match
exports.completeMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    match.status = 'result_pending';
    await match.save();
    
    // Notify participants to upload screenshots
    await Notification.createMatchReminders(match);
    
    res.json({
      success: true,
      message: 'Match marked as completed. Waiting for result verification.',
      status: match.status
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Cancel match
exports.cancelMatch = async (req, res, next) => {
  try {
    const { reason } = req.body;
    
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    if (['completed', 'cancelled'].includes(match.status)) {
      throw new BadRequestError('Match is already completed or cancelled');
    }
    
    // Refund all participants
    for (const slot of match.joinedUsers) {
      await Transaction.createTransaction({
        user: slot.user,
        type: 'credit',
        category: 'match_refund',
        amount: match.entryFee,
        description: `Refund for cancelled match: ${match.title}`,
        reference: { type: 'match', id: match._id }
      });
      
      // Notify user
      await Notification.createAndPush({
        user: slot.user,
        type: 'match_cancelled',
        title: 'Match Cancelled',
        message: `Match "${match.title}" has been cancelled. Entry fee refunded.`,
        reference: { type: 'match', id: match._id }
      });
    }
    
    match.status = 'cancelled';
    match.cancelledAt = new Date();
    match.cancelledBy = req.userId;
    match.cancellationReason = reason;
    match.refundsProcessed = true;
    
    await match.save();
    
    // Log admin action
    await AdminLog.log({
      admin: req.userId,
      action: 'match_cancel',
      targetType: 'match',
      targetId: match._id,
      description: `Cancelled match: ${match.title}. Reason: ${reason}`,
      ip: req.ip,
      severity: 'high'
    });
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`match_${match._id}`).emit('match_cancelled', { 
      matchId: match._id, 
      reason 
    });
    
    res.json({
      success: true,
      message: 'Match cancelled and all participants refunded'
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Verify result
exports.verifyResult = async (req, res, next) => {
  try {
    const { userId, position, kills, approve, rejectReason } = req.body;
    
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    const userSlot = match.joinedUsers.find(
      ju => ju.user.toString() === userId
    );
    
    if (!userSlot) {
      throw new NotFoundError('User not found in this match');
    }
    
    if (approve) {
      userSlot.position = position;
      userSlot.kills = kills;
      userSlot.screenshotStatus = 'verified';
      
      // Calculate prize
      const positionPrize = match.prizeDistribution.find(p => p.position === position)?.prize || 0;
      const killPrize = kills * match.perKillPrize;
      const totalPrize = positionPrize + killPrize;
      
      if (totalPrize > 0) {
        userSlot.prizewon = totalPrize;
        
        // Credit prize to user
        await Transaction.createTransaction({
          user: userId,
          type: 'credit',
          category: 'match_prize',
          amount: totalPrize,
          description: `Prize for ${match.title} - Position: ${position}, Kills: ${kills}`,
          reference: { type: 'match', id: match._id }
        });
        
        userSlot.prizeDistributed = true;
        
        // Update user stats
        const user = await User.findById(userId);
        user.matchesWon += position <= 3 ? 1 : 0;
        user.totalEarnings += totalPrize;
        user.addXP(100 + kills * 10 + (position <= 3 ? 50 : 0));
        await user.save();
        
        // Notify user
        await Notification.createAndPush({
          user: userId,
          type: 'result_verified',
          title: 'Result Verified!',
          message: `Your result for "${match.title}" has been verified. Prize: ₹${totalPrize}`,
          reference: { type: 'match', id: match._id },
          priority: 'high'
        });
      }
    } else {
      userSlot.screenshotStatus = 'rejected';
      userSlot.screenshotRejectionReason = rejectReason;
      
      // Notify user
      await Notification.createAndPush({
        user: userId,
        type: 'result_verified',
        title: 'Screenshot Rejected',
        message: `Your screenshot for "${match.title}" was rejected. Reason: ${rejectReason}`,
        reference: { type: 'match', id: match._id }
      });
    }
    
    // Check if all results are verified
    const allVerified = match.joinedUsers.every(
      ju => ['verified', 'rejected'].includes(ju.screenshotStatus)
    );
    
    if (allVerified) {
      match.status = 'completed';
      match.resultDeclaredAt = new Date();
      
      // Build results array
      match.results = match.joinedUsers
        .filter(ju => ju.screenshotStatus === 'verified')
        .map(ju => ({
          user: ju.user,
          position: ju.position,
          kills: ju.kills,
          prize: ju.prizewon,
          verifiedBy: req.userId,
          verifiedAt: new Date()
        }))
        .sort((a, b) => a.position - b.position);
    }
    
    await match.save();
    
    // Log admin action
    await AdminLog.log({
      admin: req.userId,
      action: 'match_result_verify',
      targetType: 'match',
      targetId: match._id,
      description: `Verified result for user ${userId} in match ${match.title}`,
      newData: { userId, position, kills, approve },
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: approve ? 'Result verified and prize credited' : 'Screenshot rejected',
      matchCompleted: allVerified
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all screenshots
exports.getAllScreenshots = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('joinedUsers.user', 'name phone');
    
    if (!match) {
      throw new NotFoundError('Match not found');
    }
    
    const screenshots = match.joinedUsers
      .filter(ju => ju.screenshot?.url)
      .map(ju => ({
        user: {
          id: ju.user._id,
          name: ju.user.name,
          phone: ju.user.phone
        },
        slotNumber: ju.slotNumber,
        inGameName: ju.inGameName,
        screenshot: ju.screenshot,
        status: ju.screenshotStatus,
        rejectionReason: ju.screenshotRejectionReason,
        result: {
          position: ju.position,
          kills: ju.kills,
          prize: ju.prizewon
        }
      }));
    
    res.json({
      success: true,
      match: {
        id: match._id,
        title: match.title,
        status: match.status
      },
      screenshots,
      pendingCount: screenshots.filter(s => s.status === 'pending').length
    });
  } catch (error) {
    next(error);
  }
};
