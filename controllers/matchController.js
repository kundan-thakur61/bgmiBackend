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
      sortOrder = 'asc',
      createdBy, // Filter by match creator
      isChallenge // Filter by challenge matches
    } = req.query;

    const query = {};

    if (gameType) query.gameType = gameType;
    if (matchType) query.matchType = matchType;
    if (status) query.status = { $in: status.split(',') };
    if (createdBy) query.createdBy = createdBy; // Add createdBy filter
    if (isChallenge !== undefined && isChallenge !== '') {
      query.isChallenge = isChallenge === 'true';
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    sort['_id'] = 1; // Secondary sort to ensure stable pagination

    // Use .lean() for faster read performance (returns plain objects)
    const matches = await Match.find(query)
      .select('-roomId -roomPassword -joinedUsers.screenshot')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name role')
      .populate('host', 'name isVerifiedHost')
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
      .limit(parseInt(limit))
      .lean();

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
      .sort({ scheduledAt: -1 })
      .lean();

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
      .populate('createdBy', 'name role')
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

// Join match (Accept Challenge)
exports.joinMatch = async (req, res, next) => {
  try {
    const { inGameId, inGameName, slotNumber } = req.body;

    const match = await Match.findById(req.params.id).select('+roomId +roomPassword');

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

    // Check if user is the creator (can't join own match as opponent)
    if (match.createdBy.toString() === req.userId.toString()) {
      throw new BadRequestError('You cannot join your own challenge as an opponent');
    }

    // Check user level requirement
    const user = await User.findById(req.userId);

    // Prevent admins from joining challenge matches  
    const adminRoles = ['admin', 'super_admin', 'match_manager'];
    if (adminRoles.includes(user.role)) {
      throw new ForbiddenError('Administrators cannot join challenge matches. Please use the admin match management panel.');
    }

    const levelOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

    if (levelOrder.indexOf(user.level) < levelOrder.indexOf(match.minLevelRequired)) {
      throw new ForbiddenError(`Minimum ${match.minLevelRequired} level required for this match`);
    }

    // Check wallet balance for entry fee
    if (user.walletBalance < match.entryFee) {
      throw new BadRequestError(`Insufficient wallet balance. You need ₹${match.entryFee} to accept this challenge`);
    }

    // Deduct entry fee from opponent
    await Transaction.createTransaction({
      user: req.userId,
      type: 'debit',
      category: 'challenge_entry',
      amount: match.entryFee,
      description: `Challenge entry fee for: ${match.title}`,
      reference: { type: 'match', id: match._id },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Update user's wallet
    user.walletBalance -= match.entryFee;
    await user.save();

    // Add user to match
    const assignedSlot = match.addUser(req.userId, inGameName, inGameId, slotNumber ? parseInt(slotNumber) : null);

    // Check if match is now full - reveal room credentials
    const isMatchFull = match.filledSlots >= match.maxSlots;
    if (isMatchFull) {
      match.roomCredentialsVisible = true;
      match.status = 'room_revealed';

      // Notify all participants that room is revealed
      const io = req.app.get('io');

      // Notify match creator
      io.to(`user_${match.createdBy}`).emit('room_revealed', {
        matchId: match._id,
        title: match.title,
        roomId: match.roomId,
        roomPassword: match.roomPassword,
        message: 'Opponent has joined! Room credentials are now available.'
      });

      // Create notification for match creator
      await Notification.createNotification(
        match.createdBy,
        'match',
        'Opponent Joined! 🎮',
        `${user.name || 'A player'} has accepted your challenge "${match.title}"! Room credentials are now visible.`,
        { matchId: match._id }
      );
    }

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
            description: `Referral commission from ${user.name}'s challenge entry`,
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
      maxSlots: match.maxSlots,
      roomRevealed: isMatchFull
    });

    // Create notification for the joining user
    await Notification.createNotification(
      req.userId,
      'match',
      'Challenge Accepted! ⚔️',
      `You've joined "${match.title}". ${isMatchFull ? 'Room credentials are now available!' : 'Waiting for more players...'}`,
      { matchId: match._id }
    );

    // Build response
    const response = {
      success: true,
      message: isMatchFull ? 'Challenge accepted! Room credentials are now available.' : 'Successfully joined the challenge',
      slotNumber,
      match: {
        id: match._id,
        title: match.title,
        scheduledAt: match.scheduledAt,
        filledSlots: match.filledSlots,
        maxSlots: match.maxSlots,
        roomRevealed: isMatchFull
      }
    };

    // Include room credentials if match is full
    if (isMatchFull) {
      response.roomCredentials = {
        roomId: match.roomId,
        roomPassword: match.roomPassword
      };
    }

    res.json(response);
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
      // Check if the match is full or if it's time to reveal the room credentials
      const isMatchFull = match.filledSlots >= match.maxSlots;
      const currentTime = new Date();
      const shouldRevealRoom = isMatchFull || (match.roomIdRevealTime && currentTime >= match.roomIdRevealTime);

      if (shouldRevealRoom) {
        match.roomCredentialsVisible = true;
        match.status = 'room_revealed';
        await match.save();
      } else {
        throw new BadRequestError('Room credentials are not available yet');
      }
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

// User: Create Challenge Match
exports.createUserMatch = async (req, res, next) => {
  try {
    const {
      title,
      description,
      gameType,
      matchType,
      mode,
      map,
      entryFee,
      prizePool,
      prizeDistribution,
      perKillPrize,
      maxSlots,
      minLevelRequired,
      scheduledAt,
      rules,
      isFeatured,
      tags,
      streamUrl,
      spectatorSlots,
      roomId,
      roomPassword
    } = req.body;

    // Validate that match type is TDM for user creation
    if (matchType !== 'tdm') {
      throw new BadRequestError('Users can only create TDM/Challenge matches');
    }

    // Check if user already has maximum active matches (limit: 3)
    const MAX_ACTIVE_MATCHES = 3;
    const activeMatchCount = await Match.countDocuments({
      createdBy: req.userId,
      isChallenge: true,
      status: { $in: ['upcoming', 'registration_open', 'registration_closed', 'room_revealed', 'live', 'result_pending'] }
    });

    if (activeMatchCount >= MAX_ACTIVE_MATCHES) {
      throw new BadRequestError(`You already have ${activeMatchCount} active challenges. Maximum ${MAX_ACTIVE_MATCHES} allowed at a time.`);
    }

    const user = await User.findById(req.userId);

    // Calculate costs: Creation Fee is FREE + Prize Pool only
    const creationFee = 0; // Free creation fee
    const totalCost = creationFee + prizePool;

    if (user.walletBalance < totalCost) {
      throw new BadRequestError(`Insufficient balance. You need ₹${totalCost} (Prize Pool: ₹${prizePool})`);
    }

    // Validate room credentials are provided
    if (!roomId || !roomPassword) {
      throw new BadRequestError('Room ID and Password are required to create a challenge match');
    }

    const match = new Match({
      title,
      description,
      gameType,
      matchType,
      mode,
      map,
      entryFee,
      prizePool,
      prizeDistribution: prizeDistribution || [
        { position: 1, prize: prizePool, label: 'Winner Takes All' }
      ],
      perKillPrize,
      maxSlots: maxSlots || 2, // Default to 1v1 challenge
      minLevelRequired: minLevelRequired || 'bronze', // Open to everyone by default
      scheduledAt,
      roomId,
      roomPassword,
      roomCredentialsVisible: false, // Hidden until opponent joins
      createdBy: req.userId,
      host: req.userId,
      rules,
      isFeatured,
      tags,
      streamUrl,
      spectatorSlots,
      status: 'registration_open', // Immediately open for opponents
      creationFee, // Store creation fee for reference
      isChallenge: true // Mark as challenge match
    });

    // Add creator as first player automatically
    match.addUser(req.userId, user.inGameName || user.name, user.inGameId || '');

    // Deduct Creation Fee from creator's wallet (only if not free)
    if (creationFee > 0) {
      await Transaction.createTransaction({
        user: req.userId,
        type: 'debit',
        category: 'match_creation_fee',
        amount: creationFee,
        description: `Challenge creation fee for: ${title}`,
        reference: { type: 'match', id: match._id }
      });
    }

    // Deduct Prize Pool from creator's wallet (held in escrow)
    await Transaction.createTransaction({
      user: req.userId,
      type: 'debit',
      category: 'prize_pool_escrow',
      amount: prizePool,
      description: `Prize pool escrow for challenge: ${title}`,
      reference: { type: 'match', id: match._id }
    });

    // Update user's wallet
    user.walletBalance -= totalCost;
    await user.save();

    await match.save();

    // Send notification to creator
    await Notification.createNotification(
      req.userId,
      'match',
      'Challenge Created!',
      `Your challenge "${title}" is now live! Entry fee: ₹${entryFee}. Waiting for opponents.`,
      { matchId: match._id }
    );

    res.status(201).json({
      success: true,
      message: 'Challenge match created successfully! Waiting for opponents to join.',
      match,
      costs: {
        creationFee,
        prizePool,
        totalDeducted: totalCost
      }
    });
  } catch (error) {
    next(error);
  }
};

// User: Cancel their own challenge match
exports.cancelUserMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Check if user is the creator
    if (match.createdBy.toString() !== req.userId.toString()) {
      throw new ForbiddenError('Only the match creator can cancel this match');
    }

    // Check if it's a challenge match
    if (!match.isChallenge) {
      throw new BadRequestError('Only challenge matches can be cancelled by users');
    }

    // Check if match can be cancelled (not started, completed, or already cancelled)
    const nonCancellableStatuses = ['live', 'completed', 'cancelled', 'result_pending'];
    if (nonCancellableStatuses.includes(match.status)) {
      throw new BadRequestError(`Cannot cancel a match with status: ${match.status}`);
    }

    // Check if opponent has already joined (only 1 participant = creator)
    if (match.filledSlots > 1) {
      throw new BadRequestError('Cannot cancel after an opponent has joined. Please wait for the match to complete.');
    }

    // Calculate refund amounts
    const creationFeeRefund = match.creationFee || 0;
    const prizePoolRefund = match.prizePool || 0;
    const totalRefund = creationFeeRefund + prizePoolRefund;

    // Refund creation fee (Transaction.createTransaction automatically updates wallet balance)
    if (creationFeeRefund > 0) {
      await Transaction.createTransaction({
        user: req.userId,
        type: 'credit',
        category: 'match_refund',
        amount: creationFeeRefund,
        description: `Creation fee refund for cancelled challenge: ${match.title}`,
        reference: { type: 'match', id: match._id }
      });
    }

    // Refund prize pool (Transaction.createTransaction automatically updates wallet balance)
    if (prizePoolRefund > 0) {
      await Transaction.createTransaction({
        user: req.userId,
        type: 'credit',
        category: 'match_refund',
        amount: prizePoolRefund,
        description: `Prize pool refund for cancelled challenge: ${match.title}`,
        reference: { type: 'match', id: match._id }
      });
    }

    // Update match status to cancelled
    match.status = 'cancelled';
    match.cancelledAt = new Date();
    match.cancelledBy = req.userId;
    match.cancellationReason = 'Cancelled by creator';
    await match.save();

    // Get updated user balance
    const updatedUser = await User.findById(req.userId);

    // Send notification to creator
    await Notification.createNotification(
      req.userId,
      'match',
      'Challenge Cancelled',
      `Your challenge "${match.title}" has been cancelled. ₹${totalRefund} has been refunded to your wallet.`,
      { matchId: match._id, refundAmount: totalRefund }
    );

    res.json({
      success: true,
      message: 'Challenge cancelled successfully',
      refund: {
        creationFee: creationFeeRefund,
        prizePool: prizePoolRefund,
        total: totalRefund
      },
      newWalletBalance: updatedUser.walletBalance
    });
  } catch (error) {
    next(error);
  }
};

// User: Update their own challenge match
exports.updateUserMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Check if user is the creator or admin
    const isCreator = match.createdBy.toString() === req.userId.toString();
    const user = await User.findById(req.userId);
    const isAdmin = user?.role && ['admin', 'super_admin', 'match_manager'].includes(user.role);

    if (!isCreator && !isAdmin) {
      throw new ForbiddenError('Only the match creator can update this match');
    }

    // Check if match can be updated (not started, completed, or cancelled)
    const nonUpdatableStatuses = ['live', 'completed', 'cancelled', 'result_pending'];
    if (nonUpdatableStatuses.includes(match.status)) {
      throw new BadRequestError(`Cannot update a match with status: ${match.status}`);
    }

    // Allowed fields for user update (prizePool is NOT allowed to prevent fraud)
    const allowedUpdates = [
      'title', 'description', 'entryFee', 'perKillPrize',
      'scheduledAt', 'rules', 'minLevelRequired'
    ];

    // Only allow maxSlots update if no other players have joined (only creator is in)
    if (match.filledSlots <= 1 && req.body.maxSlots !== undefined) {
      allowedUpdates.push('maxSlots');
    }

    // Apply updates
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        match[field] = req.body[field];
      }
    });

    await match.save();

    // Send notification about update
    await Notification.createNotification(
      req.userId,
      'match',
      'Challenge Updated',
      `Your challenge "${match.title}" has been updated successfully.`,
      { matchId: match._id }
    );

    res.json({
      success: true,
      message: 'Match updated successfully',
      match
    });
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

    // Validate prize pool is a positive number
    if (matchData.prizePool !== undefined) {
      if (typeof matchData.prizePool !== 'number' || isNaN(matchData.prizePool)) {
        return res.status(400).json({
          success: false,
          message: 'Prize pool must be a valid number'
        });
      }
      if (matchData.prizePool < 0) {
        return res.status(400).json({
          success: false,
          message: 'Prize pool must be a positive value'
        });
      }
    }

    // Set default currency if not provided
    if (!matchData.prizePoolCurrency) {
      matchData.prizePoolCurrency = 'INR';
    }

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
      'title', 'description', 'entryFee', 'prizePool', 'prizePoolCurrency', 'prizeDistribution',
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

    const match = await Match.findById(req.params.id)
      .populate('joinedUsers.user', '_id');

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

      // Emit socket event to match room
      const io = req.app.get('io');
      io.to(`match_${match._id}`).emit('room_revealed', {
        matchId: match._id,
        roomId,
        roomPassword
      });

      // Also emit to each participant's personal room for redundancy
      if (match.joinedUsers && match.joinedUsers.length > 0) {
        for (const participant of match.joinedUsers) {
          const userId = participant.user?._id || participant.user;
          if (userId) {
            io.to(`user_${userId}`).emit('room_revealed', {
              matchId: match._id,
              roomId,
              roomPassword
            });
          }
        }
      }
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

// Admin: Declare winners and distribute prizes
exports.declareWinners = async (req, res, next) => {
  try {
    const { winners = [] } = req.body;

    if (!Array.isArray(winners) || winners.length === 0) {
      throw new BadRequestError('Winners list is required');
    }

    const match = await Match.findById(req.params.id);

    if (!match) {
      throw new NotFoundError('Match not found');
    }

    if (match.status === 'completed') {
      throw new BadRequestError('Match is already completed');
    }

    const winnersByUser = new Map(
      winners.map(w => [w.userId?.toString(), w])
    );

    const resultEntries = [];

    for (const slot of match.joinedUsers) {
      const winnerData = winnersByUser.get(slot.user.toString());

      if (winnerData) {
        const position = Number(winnerData.position) || 0;
        const kills = Number(winnerData.kills) || 0;

        slot.position = position;
        slot.kills = kills;
        slot.screenshotStatus = 'verified';

        const positionPrize = match.prizeDistribution.find(p => p.position === position)?.prize || 0;
        const killPrize = kills * match.perKillPrize;
        const totalPrize = positionPrize + killPrize;

        if (totalPrize > 0) {
          slot.prizewon = totalPrize;

          if (!slot.prizeDistributed) {
            await Transaction.createTransaction({
              user: slot.user,
              type: 'credit',
              category: 'match_prize',
              amount: totalPrize,
              description: `Prize for ${match.title} - Position: ${position}, Kills: ${kills}`,
              reference: { type: 'match', id: match._id }
            });

            slot.prizeDistributed = true;

            const user = await User.findById(slot.user);
            if (user) {
              user.matchesWon += position <= 3 ? 1 : 0;
              user.totalEarnings += totalPrize;
              user.addXP(100 + kills * 10 + (position <= 3 ? 50 : 0));
              await user.save();
            }

            await Notification.createAndPush({
              user: slot.user,
              type: 'result_verified',
              title: 'You Won! 🎉',
              message: `Prize for "${match.title}" credited. Amount: ₹${totalPrize}`,
              reference: { type: 'match', id: match._id },
              priority: 'high'
            });
          }
        }

        resultEntries.push({
          user: slot.user,
          position,
          kills,
          prize: slot.prizewon || 0,
          verifiedBy: req.userId,
          verifiedAt: new Date()
        });
      } else {
        slot.screenshotStatus = 'rejected';
        slot.screenshotRejectionReason = 'Not in winners list';
      }
    }

    match.status = 'completed';
    match.resultDeclaredAt = new Date();
    match.results = resultEntries.sort((a, b) => a.position - b.position);

    await match.save();

    await AdminLog.log({
      admin: req.userId,
      action: 'match_result_declare',
      targetType: 'match',
      targetId: match._id,
      description: `Declared winners for match: ${match.title}`,
      newData: { winners },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: 'Winners declared and prizes distributed',
      status: match.status,
      winnersCount: resultEntries.length
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
