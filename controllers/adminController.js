const { User, Match, Tournament, Transaction, Withdrawal, KYC, Ticket, Announcement, AdminLog, Dispute, Notification } = require('../models');
const { BadRequestError, NotFoundError } = require('../middleware/errorHandler');
const mongoose = require('mongoose');
const os = require('os');

// Get dashboard data
exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, newUsersToday, activeMatches, pendingWithdrawals, pendingKyc, openTickets] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      Match.countDocuments({ status: { $in: ['upcoming', 'registration_open', 'live'] } }),
      Withdrawal.countDocuments({ status: 'pending' }),
      KYC.countDocuments({ status: 'pending' }),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } })
    ]);

    const todayRevenue = await Transaction.aggregate([
      { $match: { type: 'debit', category: 'match_entry', createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentActivity = await AdminLog.find().sort({ createdAt: -1 }).limit(10).populate('admin', 'name');

    res.json({
      success: true,
      dashboard: {
        users: { total: totalUsers, newToday: newUsersToday },
        matches: { active: activeMatches },
        withdrawals: { pending: pendingWithdrawals },
        kyc: { pending: pendingKyc },
        tickets: { open: openTickets },
        revenue: { today: todayRevenue[0]?.total || 0 },
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get stats
exports.getStats = async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    let startDate = new Date();

    switch (period) {
      case '24h': startDate.setHours(startDate.getHours() - 24); break;
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
    }

    const [userGrowth, revenueByDay] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'debit', category: { $in: ['match_entry', 'tournament_entry'] }, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({ success: true, stats: { period, userGrowth, revenueByDay } });
  } catch (error) {
    next(error);
  }
};

// Get users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, isBanned, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = {};

    // SECURITY: Escape special regex characters to prevent NoSQL injection
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { phone: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';

    // SECURITY: Validate sortBy to prevent NoSQL injection
    const allowedSortFields = ['createdAt', 'name', 'email', 'role', 'walletBalance', 'lastLoginAt'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const users = await User.find(query)
      .select('-otp -password -deviceFingerprints')
      .sort({ [safeSortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ success: true, users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

// Get single user
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-otp -password');
    if (!user) throw new NotFoundError('User not found');

    const transactions = await Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);
    const matches = await Match.find({ 'joinedUsers.user': user._id }).select('title gameType entryFee status').sort({ scheduledAt: -1 }).limit(10);

    res.json({ success: true, user, transactions, matches });
  } catch (error) {
    next(error);
  }
};

// Update user
exports.updateUser = async (req, res, next) => {
  try {
    const updates = {};
    ['name', 'email', 'isKycVerified', 'isAgeVerified'].forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select('-otp -password');
    if (!user) throw new NotFoundError('User not found');

    res.json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// Ban user
exports.banUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');
    if (user.role === 'super_admin') throw new BadRequestError('Cannot ban super admin');

    user.isBanned = true;
    user.banReason = reason;
    user.bannedAt = new Date();
    user.bannedBy = req.userId;
    await user.save();

    await AdminLog.log({ admin: req.userId, action: 'user_ban', targetType: 'user', targetId: user._id, description: `Banned user: ${user.name}. Reason: ${reason}`, ip: req.ip, severity: 'high' });

    res.json({ success: true, message: 'User banned successfully' });
  } catch (error) {
    next(error);
  }
};

// Unban user
exports.unbanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    user.isBanned = false;
    user.banReason = undefined;
    user.bannedAt = undefined;
    user.bannedBy = undefined;
    await user.save();

    await AdminLog.log({ admin: req.userId, action: 'user_unban', targetType: 'user', targetId: user._id, description: `Unbanned user: ${user.name}`, ip: req.ip });

    res.json({ success: true, message: 'User unbanned successfully' });
  } catch (error) {
    next(error);
  }
};

// Change user role
exports.changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'host', 'match_manager', 'finance_manager', 'support', 'admin'];

    if (!validRoles.includes(role)) throw new BadRequestError('Invalid role');

    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await AdminLog.log({ admin: req.userId, action: 'user_role_change', targetType: 'user', targetId: user._id, description: `Changed role from ${previousRole} to ${role}`, previousData: { role: previousRole }, newData: { role }, ip: req.ip, severity: 'high' });

    res.json({ success: true, message: 'User role updated', user: { id: user._id, name: user.name, role: user.role } });
  } catch (error) {
    next(error);
  }
};

// Adjust wallet
exports.adjustWallet = async (req, res, next) => {
  try {
    const { amount, type, reason } = req.body;
    if (!amount || !type || !reason) throw new BadRequestError('Amount, type, and reason are required');

    // Prevent admin from adjusting their own wallet
    if (req.params.id === req.userId.toString()) {
      throw new ForbiddenError('Cannot adjust your own wallet');
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    await Transaction.createTransaction({
      user: user._id,
      type,
      category: type === 'credit' ? 'admin_credit' : 'admin_debit',
      amount: Math.abs(amount),
      description: `Admin adjustment: ${reason}`,
      processedBy: req.userId,
      ip: req.ip
    });

    const updatedUser = await User.findById(req.params.id).select('walletBalance');

    await AdminLog.log({ admin: req.userId, action: type === 'credit' ? 'wallet_credit' : 'wallet_debit', targetType: 'user', targetId: user._id, description: `${type === 'credit' ? 'Credited' : 'Debited'} ${amount} to ${user.name}. Reason: ${reason}`, ip: req.ip, severity: 'high' });

    res.json({ success: true, message: 'Wallet adjusted', newBalance: updatedUser.walletBalance });
  } catch (error) {
    next(error);
  }
};

// Get logs
exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, adminId, startDate, endDate } = req.query;
    const query = {};

    if (action) query.action = action;
    if (adminId) query.admin = adminId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AdminLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).populate('admin', 'name email role');
    const total = await AdminLog.countDocuments(query);

    res.json({ success: true, logs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

// Get my activity
exports.getMyActivity = async (req, res, next) => {
  try {
    const logs = await AdminLog.getAdminActivity(req.userId, req.query);
    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

// Get announcements
exports.getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).populate('createdBy', 'name');
    res.json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
};

// Create announcement
exports.createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create({ ...req.body, createdBy: req.userId });
    await AdminLog.log({ admin: req.userId, action: 'announcement_create', targetType: 'announcement', targetId: announcement._id, description: `Created announcement: ${announcement.title}`, ip: req.ip });
    res.status(201).json({ success: true, message: 'Announcement created', announcement });
  } catch (error) {
    next(error);
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res, next) => {
  try {
    // Whitelist allowed fields to prevent overwriting protected fields
    const allowedFields = ['title', 'message', 'type', 'isActive', 'expiresAt', 'priority'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!announcement) throw new NotFoundError('Announcement not found');
    res.json({ success: true, message: 'Announcement updated', announcement });
  } catch (error) {
    next(error);
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) throw new NotFoundError('Announcement not found');
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
};

// Revenue report
exports.getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const revenue = await Transaction.aggregate([
      { $match: { ...match, type: 'debit', category: { $in: ['match_entry', 'tournament_entry'] } } },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const withdrawals = await Transaction.aggregate([
      { $match: { ...match, type: 'debit', category: 'withdrawal' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const deposits = await Transaction.aggregate([
      { $match: { ...match, type: 'credit', category: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({ success: true, report: { revenue, withdrawals: withdrawals[0] || { total: 0, count: 0 }, deposits: deposits[0] || { total: 0, count: 0 } } });
  } catch (error) {
    next(error);
  }
};

// User report
exports.getUserReport = async (req, res, next) => {
  try {
    const [total, verified, banned, byLevel] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isKycVerified: true }),
      User.countDocuments({ isBanned: true }),
      User.aggregate([{ $group: { _id: '$level', count: { $sum: 1 } } }])
    ]);

    res.json({ success: true, report: { total, verified, banned, byLevel } });
  } catch (error) {
    next(error);
  }
};

// Match report
exports.getMatchReport = async (req, res, next) => {
  try {
    const [total, byStatus, byGame] = await Promise.all([
      Match.countDocuments(),
      Match.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Match.aggregate([{ $group: { _id: '$gameType', count: { $sum: 1 }, totalPrize: { $sum: '$prizePool' } } }])
    ]);

    res.json({ success: true, report: { total, byStatus, byGame } });
  } catch (error) {
    next(error);
  }
};

// Get dispute statistics
exports.getDisputeStats = async (req, res, next) => {
  try {
    const Dispute = require('../models').Dispute;

    const [total, byStatus, recentDisputes] = await Promise.all([
      Dispute.countDocuments(),
      Dispute.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Dispute.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('submittedBy', 'name phone')
        .populate('match', 'title')
        .populate('assignedTo', 'name')
    ]);

    const statusCounts = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0
    };

    byStatus.forEach(item => {
      if (statusCounts.hasOwnProperty(item._id)) {
        statusCounts[item._id] = item.count;
      }
    });

    res.json({
      success: true,
      stats: {
        total,
        ...statusCounts,
        pending: statusCounts.open + statusCounts.in_progress,
        recentDisputes
      }
    });
  } catch (error) {
    next(error);
  }
};

// Broadcast push notification to users
exports.broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type, url, targetAudience, level } = req.body;

    if (!title || !message) {
      throw new BadRequestError('Title and message are required');
    }

    const Notification = require('../models').Notification;
    const pushService = require('../utils/pushService');

    // Build user query based on target audience
    let userQuery = { isBanned: false };

    switch (targetAudience) {
      case 'verified':
        userQuery.isKycVerified = true;
        break;
      case 'level':
        if (level) userQuery.level = parseInt(level);
        break;
      case 'all':
      default:
        // No additional filters
        break;
    }

    // Get users with push subscriptions
    const users = await User.find({
      ...userQuery,
      pushSubscription: { $exists: true, $ne: null }
    }).select('_id pushSubscription');

    // Create in-app notifications for all matching users
    const allMatchingUsers = await User.find(userQuery).select('_id');

    const notificationPromises = allMatchingUsers.map(user =>
      Notification.create({
        user: user._id,
        type: type || 'announcement',
        title,
        message,
        data: { url: url || '/' }
      })
    );

    await Promise.all(notificationPromises);

    // Send push notifications
    let pushResults = { success: 0, failed: 0, expired: [] };

    if (pushService.isEnabled() && users.length > 0) {
      const subscriptions = users.map(u => ({
        userId: u._id,
        subscription: u.pushSubscription
      }));

      pushResults = await pushService.sendBulkPush(subscriptions, {
        title,
        body: message,
        url: url || '/',
        type: type || 'announcement'
      });

      // Remove expired subscriptions
      if (pushResults.expired.length > 0) {
        await User.updateMany(
          { _id: { $in: pushResults.expired } },
          { $unset: { pushSubscription: 1 } }
        );
      }
    }

    await AdminLog.log({
      admin: req.userId,
      action: 'broadcast_notification',
      targetType: 'system',
      description: `Broadcast notification: "${title}" to ${allMatchingUsers.length} users (${targetAudience || 'all'})`,
      newData: { title, message, targetAudience, recipients: allMatchingUsers.length },
      ip: req.ip,
      severity: 'medium'
    });

    res.json({
      success: true,
      message: 'Broadcast sent successfully',
      results: {
        notificationsCreated: allMatchingUsers.length,
        pushSent: pushResults.success,
        pushFailed: pushResults.failed,
        expiredSubscriptions: pushResults.expired.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get referral statistics
exports.getReferralStats = async (req, res, next) => {
  try {
    const referralStats = await User.aggregate([
      { $match: { referredBy: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ]);

    const topReferrers = await User.aggregate([
      { $match: { referralCount: { $gt: 0 } } },
      { $project: { name: 1, phone: 1, referralCount: 1, referralEarnings: 1 } },
      { $sort: { referralCount: -1 } },
      { $limit: 10 }
    ]);

    const totalReferrals = await User.countDocuments({ referredBy: { $exists: true, $ne: null } });
    const totalEarnings = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$referralEarnings' } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalReferrals,
        totalEarnings: totalEarnings[0]?.total || 0,
        dailyReferrals: referralStats,
        topReferrers
      }
    });
  } catch (error) {
    next(error);
  }
};

// =====================================================
// ENHANCED ADMIN DASHBOARD - ADDITIONAL METHODS
// =====================================================

// Get system health & server status
exports.getSystemHealth = async (req, res, next) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    // Check DB latency
    const dbStart = Date.now();
    await mongoose.connection.db.admin().ping();
    const dbLatency = Date.now() - dbStart;

    // Memory usage
    const memUsage = process.memoryUsage();
    const systemMem = { total: os.totalmem(), free: os.freemem(), used: os.totalmem() - os.freemem() };

    // Get active socket connections count
    const io = req.app.get('io');
    const activeConnections = io ? io.engine.clientsCount : 0;

    // Uptime
    const uptime = process.uptime();

    res.json({
      success: true,
      health: {
        status: dbState === 1 ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        server: {
          nodeVersion: process.version,
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: {
            seconds: Math.floor(uptime),
            formatted: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
          },
          pid: process.pid,
          cpuCount: os.cpus().length
        },
        memory: {
          process: {
            rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
            heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`
          },
          system: {
            total: `${(systemMem.total / 1024 / 1024 / 1024).toFixed(2)} GB`,
            free: `${(systemMem.free / 1024 / 1024 / 1024).toFixed(2)} GB`,
            usagePercent: `${((systemMem.used / systemMem.total) * 100).toFixed(1)}%`
          }
        },
        database: {
          state: dbStateMap[dbState],
          latencyMs: dbLatency,
          name: mongoose.connection.name,
          host: mongoose.connection.host
        },
        realtime: {
          activeConnections
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get full transaction history with advanced filters (admin view)
exports.getTransactionHistory = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 50, type, category, status,
      userId, minAmount, maxAmount, startDate, endDate,
      sortBy = 'createdAt', sortOrder = 'desc', search
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (userId) query.user = userId;
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { 'paymentDetails.paymentId': { $regex: search, $options: 'i' } },
        { 'paymentDetails.orderId': { $regex: search, $options: 'i' } }
      ];
    }

    const [transactions, total, aggregatedStats] = await Promise.all([
      Transaction.find(query)
        .populate('user', 'name phone email')
        .populate('processedBy', 'name')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            maxAmount: { $max: '$amount' },
            minAmount: { $min: '$amount' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      transactions,
      stats: aggregatedStats[0] || { totalAmount: 0, avgAmount: 0, maxAmount: 0, minAmount: 0 },
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

// Get withdrawal management queue
exports.getWithdrawalQueue = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, method, startDate, endDate, sortBy = 'createdAt', sortOrder = 'asc' } = req.query;

    const query = {};
    if (status) query.status = status;
    else query.status = { $in: ['pending', 'processing', 'approved'] }; // Default: show actionable items
    if (method) query.method = method;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [withdrawals, total, statusCounts, totalAmounts] = await Promise.all([
      Withdrawal.find(query)
        .populate('user', 'name phone email walletBalance isKycVerified level')
        .populate('processedBy', 'name')
        .populate('rejectedBy', 'name')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Withdrawal.countDocuments(query),
      Withdrawal.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
      ]),
      Withdrawal.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = { count: s.count, totalAmount: s.totalAmount }; });

    res.json({
      success: true,
      withdrawals,
      summary: {
        statusBreakdown: statusMap,
        pendingTotal: totalAmounts[0] || { total: 0, count: 0 }
      },
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

// Get KYC verification queue
exports.getKycQueue = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, documentType, sortBy = 'createdAt', sortOrder = 'asc' } = req.query;

    const query = {};
    if (status) query.status = status;
    else query.status = { $in: ['pending', 'under_review'] };
    if (documentType) query.documentType = documentType;

    const [kycRequests, total, statusCounts] = await Promise.all([
      KYC.find(query)
        .populate('user', 'name phone email createdAt level matchesPlayed')
        .populate('verifiedBy', 'name')
        .populate('rejectedBy', 'name')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      KYC.countDocuments(query),
      KYC.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      success: true,
      kycRequests,
      summary: {
        statusBreakdown: statusMap,
        pendingCount: (statusMap['pending'] || 0) + (statusMap['under_review'] || 0),
        totalApproved: statusMap['approved'] || 0,
        totalRejected: statusMap['rejected'] || 0
      },
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

// Get ticket management overview
exports.getTicketOverview = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, priority, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { ticketId: { $regex: search, $options: 'i' } }
      ];
    }

    const [tickets, total, statusCounts, categoryCounts, priorityCounts, avgResolutionTime] = await Promise.all([
      Ticket.find(query)
        .populate('user', 'name phone email level')
        .populate('messages.sender', 'name role')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Ticket.countDocuments(query),
      Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Ticket.aggregate([
        { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
        {
          $project: {
            resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] }
          }
        },
        {
          $group: {
            _id: null,
            avgTimeMs: { $avg: '$resolutionTime' }
          }
        }
      ])
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });
    const categoryMap = {};
    categoryCounts.forEach(c => { categoryMap[c._id] = c.count; });
    const priorityMap = {};
    priorityCounts.forEach(p => { priorityMap[p._id] = p.count; });

    res.json({
      success: true,
      tickets,
      summary: {
        byStatus: statusMap,
        byCategory: categoryMap,
        byPriority: priorityMap,
        openCount: (statusMap['open'] || 0) + (statusMap['in_progress'] || 0),
        avgResolutionTimeHours: avgResolutionTime[0] ? Math.round(avgResolutionTime[0].avgTimeMs / 3600000) : null
      },
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

// Get match management overview
exports.getMatchOverview = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, gameType, matchType, startDate, endDate, search, sortBy = 'scheduledAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (gameType) query.gameType = gameType;
    if (matchType) query.matchType = matchType;
    if (startDate || endDate) {
      query.scheduledAt = {};
      if (startDate) query.scheduledAt.$gte = new Date(startDate);
      if (endDate) query.scheduledAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const [matches, total, statusCounts, revenueByGame, todayMatchCount] = await Promise.all([
      Match.find(query)
        .populate('createdBy', 'name role')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Match.countDocuments(query),
      Match.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Match.aggregate([
        { $group: { _id: '$gameType', count: { $sum: 1 }, totalPrize: { $sum: '$prizePool' }, totalEntryRevenue: { $sum: { $multiply: ['$entryFee', '$filledSlots'] } } } }
      ]),
      Match.countDocuments({
        scheduledAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      success: true,
      matches,
      summary: {
        byStatus: statusMap,
        byGame: revenueByGame,
        todayMatches: todayMatchCount,
        liveCount: statusMap['live'] || 0,
        upcomingCount: (statusMap['upcoming'] || 0) + (statusMap['registration_open'] || 0)
      },
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

// Get dispute management overview
exports.getDisputeOverview = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, priority, reason, assignedTo, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (reason) query.reason = reason;
    if (assignedTo) query.assignedTo = assignedTo;

    const [disputes, total, statusCounts, priorityCounts, reasonCounts, avgResolution] = await Promise.all([
      Dispute.find(query)
        .populate('submittedBy', 'name phone email')
        .populate('match', 'title gameType status')
        .populate('assignedTo', 'name')
        .populate('resolvedBy', 'name')
        .populate('adminNotes.addedBy', 'name')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Dispute.countDocuments(query),
      Dispute.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Dispute.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Dispute.aggregate([{ $group: { _id: '$reason', count: { $sum: 1 } } }]),
      Dispute.aggregate([
        { $match: { resolvedAt: { $exists: true } } },
        { $project: { resolutionTime: { $subtract: ['$resolvedAt', '$createdAt'] } } },
        { $group: { _id: null, avgTimeMs: { $avg: '$resolutionTime' } } }
      ])
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });
    const priorityMap = {};
    priorityCounts.forEach(p => { priorityMap[p._id] = p.count; });
    const reasonMap = {};
    reasonCounts.forEach(r => { reasonMap[r._id] = r.count; });

    res.json({
      success: true,
      disputes,
      summary: {
        byStatus: statusMap,
        byPriority: priorityMap,
        byReason: reasonMap,
        pendingCount: (statusMap['pending'] || 0) + (statusMap['under_review'] || 0),
        urgentCount: priorityMap['urgent'] || 0,
        avgResolutionTimeHours: avgResolution[0] ? Math.round(avgResolution[0].avgTimeMs / 3600000) : null
      },
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

// Assign dispute to admin
exports.assignDispute = async (req, res, next) => {
  try {
    const { adminId } = req.body;
    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) throw new NotFoundError('Dispute not found');

    const assignee = await User.findById(adminId);
    if (!assignee || !['admin', 'super_admin', 'support'].includes(assignee.role)) {
      throw new BadRequestError('Invalid admin user for assignment');
    }

    dispute.assignedTo = adminId;
    dispute.status = 'under_review';
    await dispute.save();

    await AdminLog.log({
      admin: req.userId,
      action: 'dispute_assign',
      targetType: 'dispute',
      targetId: dispute._id,
      description: `Assigned dispute to ${assignee.name}`,
      ip: req.ip
    });

    res.json({ success: true, message: 'Dispute assigned successfully', dispute });
  } catch (error) {
    next(error);
  }
};

// Resolve dispute
exports.resolveDispute = async (req, res, next) => {
  try {
    const { resolution, resolutionNotes, resolutionAction } = req.body;
    if (!resolution) throw new BadRequestError('Resolution type is required');

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) throw new NotFoundError('Dispute not found');

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.resolutionNotes = resolutionNotes;
    dispute.resolutionAction = resolutionAction;
    dispute.resolvedBy = req.userId;
    dispute.resolvedAt = new Date();
    await dispute.save();

    // Notify user of resolution
    await Notification.create({
      user: dispute.submittedBy,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `Your dispute has been ${resolution}. ${resolutionNotes || ''}`,
      data: { disputeId: dispute._id }
    });

    await AdminLog.log({
      admin: req.userId,
      action: 'dispute_resolve',
      targetType: 'dispute',
      targetId: dispute._id,
      description: `Resolved dispute: ${resolution}`,
      newData: { resolution, resolutionNotes },
      ip: req.ip,
      severity: 'medium'
    });

    res.json({ success: true, message: 'Dispute resolved', dispute });
  } catch (error) {
    next(error);
  }
};

// Add admin note to dispute
exports.addDisputeNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note) throw new BadRequestError('Note text is required');

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) throw new NotFoundError('Dispute not found');

    dispute.adminNotes.push({
      note,
      addedBy: req.userId,
      addedAt: new Date()
    });
    await dispute.save();

    res.json({ success: true, message: 'Note added', dispute });
  } catch (error) {
    next(error);
  }
};

// Get user growth analytics (detailed)
exports.getUserGrowthAnalytics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    let startDate = new Date();
    let groupFormat = '%Y-%m-%d';

    switch (period) {
      case '24h': startDate.setHours(startDate.getHours() - 24); groupFormat = '%Y-%m-%d %H:00'; break;
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      case '90d': startDate.setDate(startDate.getDate() - 90); groupFormat = '%Y-%U'; break;
      case '1y': startDate.setFullYear(startDate.getFullYear() - 1); groupFormat = '%Y-%m'; break;
    }

    const [registrations, activeUsers, retentionData, levelDistribution, roleDistribution, topStates] = await Promise.all([
      // New registrations over time
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Active users (logged in during period)
      User.aggregate([
        { $match: { lastLoginAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: groupFormat, date: '$lastLoginAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Retention (users who played matches)
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalNew: { $sum: 1 },
            playedMatch: { $sum: { $cond: [{ $gt: ['$matchesPlayed', 0] }, 1, 0] } },
            kycVerified: { $sum: { $cond: ['$isKycVerified', 1, 0] } },
            deposited: { $sum: { $cond: [{ $gt: ['$walletBalance', 0] }, 1, 0] } }
          }
        }
      ]),
      // Level distribution
      User.aggregate([
        { $group: { _id: '$level', count: { $sum: 1 }, avgXP: { $avg: '$xp' } } },
        { $sort: { count: -1 } }
      ]),
      // Role distribution
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Top locations (from last login IP - basic geo)
      User.aggregate([
        { $match: { lastLoginIp: { $exists: true, $ne: null } } },
        { $group: { _id: '$lastLoginIp', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const retention = retentionData[0] || { totalNew: 0, playedMatch: 0, kycVerified: 0, deposited: 0 };

    res.json({
      success: true,
      analytics: {
        period,
        registrations,
        activeUsers,
        retention: {
          ...retention,
          matchRetentionRate: retention.totalNew ? ((retention.playedMatch / retention.totalNew) * 100).toFixed(1) : 0,
          kycConversionRate: retention.totalNew ? ((retention.kycVerified / retention.totalNew) * 100).toFixed(1) : 0,
          depositRate: retention.totalNew ? ((retention.deposited / retention.totalNew) * 100).toFixed(1) : 0
        },
        levelDistribution,
        roleDistribution,
        topIPs: topStates
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get advanced revenue analytics
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    let startDate = new Date();
    let groupFormat = '%Y-%m-%d';

    switch (period) {
      case '24h': startDate.setHours(startDate.getHours() - 24); groupFormat = '%Y-%m-%d %H:00'; break;
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      case '90d': startDate.setDate(startDate.getDate() - 90); groupFormat = '%Y-%U'; break;
      case '1y': startDate.setFullYear(startDate.getFullYear() - 1); groupFormat = '%Y-%m'; break;
    }

    const dateFilter = { createdAt: { $gte: startDate } };

    const [
      revenueTimeline, depositTimeline, withdrawalTimeline,
      categoryBreakdown, paymentMethodBreakdown, topSpenders,
      platformProfit, dailyVolume
    ] = await Promise.all([
      // Revenue (entry fees) over time
      Transaction.aggregate([
        { $match: { ...dateFilter, type: 'debit', category: { $in: ['match_entry', 'tournament_entry', 'challenge_entry'] } } },
        { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Deposits over time
      Transaction.aggregate([
        { $match: { ...dateFilter, type: 'credit', category: 'deposit', status: 'completed' } },
        { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Withdrawals over time
      Transaction.aggregate([
        { $match: { ...dateFilter, type: 'debit', category: 'withdrawal' } },
        { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      // Revenue by category
      Transaction.aggregate([
        { $match: { ...dateFilter, type: 'debit', category: { $in: ['match_entry', 'tournament_entry', 'challenge_entry', 'match_creation_fee'] } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      // Payment method breakdown (deposits)
      Transaction.aggregate([
        { $match: { ...dateFilter, type: 'credit', category: 'deposit', status: 'completed' } },
        { $group: { _id: '$paymentDetails.method', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      // Top spenders
      Transaction.aggregate([
        { $match: { ...dateFilter, type: 'debit', category: { $in: ['match_entry', 'tournament_entry'] } } },
        { $group: { _id: '$user', totalSpent: { $sum: '$amount' }, matchCount: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { 'user.name': 1, 'user.phone': 1, 'user.level': 1, totalSpent: 1, matchCount: 1 } }
      ]),
      // Platform profit (total entries - total prizes paid)
      Promise.all([
        Transaction.aggregate([
          { $match: { ...dateFilter, type: 'debit', category: { $in: ['match_entry', 'tournament_entry', 'match_creation_fee'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Transaction.aggregate([
          { $match: { ...dateFilter, type: 'credit', category: { $in: ['match_prize', 'tournament_prize'] } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]),
      // Daily transaction volume
      Transaction.aggregate([
        { $match: dateFilter },
        { $group: { _id: { $dateToString: { format: groupFormat, date: '$createdAt' } }, volume: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalEntries = platformProfit[0][0]?.total || 0;
    const totalPrizes = platformProfit[1][0]?.total || 0;

    res.json({
      success: true,
      analytics: {
        period,
        revenueTimeline,
        depositTimeline,
        withdrawalTimeline,
        categoryBreakdown,
        paymentMethodBreakdown,
        topSpenders,
        platformProfit: {
          totalEntryRevenue: totalEntries,
          totalPrizesPaid: totalPrizes,
          netProfit: totalEntries - totalPrizes,
          profitMargin: totalEntries ? (((totalEntries - totalPrizes) / totalEntries) * 100).toFixed(1) : 0
        },
        dailyVolume
      }
    });
  } catch (error) {
    next(error);
  }
};

// Force logout user (invalidate sessions)
exports.forceLogoutUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    // Clear push subscription to force re-auth
    user.pushSubscription = undefined;
    user.deviceFingerprints = [];
    await user.save();

    // Disconnect user's socket connections
    const io = req.app.get('io');
    if (io) {
      const userRoom = `user_${user._id}`;
      io.to(userRoom).emit('force_logout', { message: 'Your session has been terminated by admin.' });
      const sockets = await io.in(userRoom).fetchSockets();
      sockets.forEach(socket => socket.disconnect(true));
    }

    await AdminLog.log({
      admin: req.userId,
      action: 'user_force_logout',
      targetType: 'user',
      targetId: user._id,
      description: `Force logged out user: ${user.name}`,
      ip: req.ip,
      severity: 'high'
    });

    res.json({ success: true, message: `User ${user.name} has been force logged out` });
  } catch (error) {
    next(error);
  }
};

// Export data as CSV
exports.exportData = async (req, res, next) => {
  try {
    const { type, startDate, endDate, status } = req.query;
    if (!type) throw new BadRequestError('Export type is required (users, transactions, withdrawals, matches)');

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let data = [];
    let headers = [];
    let filename = '';

    switch (type) {
      case 'users': {
        const users = await User.find(dateFilter).select('name phone email level walletBalance matchesPlayed matchesWon totalEarnings isKycVerified isBanned role createdAt lastLoginAt').lean();
        headers = ['Name', 'Phone', 'Email', 'Level', 'Wallet', 'Matches Played', 'Matches Won', 'Earnings', 'KYC', 'Banned', 'Role', 'Joined', 'Last Login'];
        data = users.map(u => [u.name, u.phone, u.email, u.level, u.walletBalance, u.matchesPlayed, u.matchesWon, u.totalEarnings, u.isKycVerified, u.isBanned, u.role, u.createdAt?.toISOString(), u.lastLoginAt?.toISOString()]);
        filename = 'users_export.csv';
        break;
      }
      case 'transactions': {
        const filter = { ...dateFilter };
        if (status) filter.status = status;
        const txns = await Transaction.find(filter).populate('user', 'name phone').lean();
        headers = ['Date', 'User', 'Phone', 'Type', 'Category', 'Amount', 'Balance Before', 'Balance After', 'Status', 'Description'];
        data = txns.map(t => [t.createdAt?.toISOString(), t.user?.name, t.user?.phone, t.type, t.category, t.amount, t.balanceBefore, t.balanceAfter, t.status, t.description]);
        filename = 'transactions_export.csv';
        break;
      }
      case 'withdrawals': {
        const filter = { ...dateFilter };
        if (status) filter.status = status;
        const wds = await Withdrawal.find(filter).populate('user', 'name phone email').lean();
        headers = ['Date', 'User', 'Phone', 'Method', 'Amount', 'Net Amount', 'TDS', 'Status', 'UPI ID', 'Bank Name', 'Account'];
        data = wds.map(w => [w.createdAt?.toISOString(), w.user?.name, w.user?.phone, w.method, w.amount, w.netAmount, w.tds, w.status, w.upiId, w.bankDetails?.bankName, w.bankDetails?.accountNumber]);
        filename = 'withdrawals_export.csv';
        break;
      }
      case 'matches': {
        const filter = { ...dateFilter };
        if (status) filter.status = status;
        const matches = await Match.find(filter).select('title gameType matchType mode entryFee prizePool maxSlots filledSlots status scheduledAt createdAt').lean();
        headers = ['Title', 'Game', 'Type', 'Mode', 'Entry Fee', 'Prize Pool', 'Max Slots', 'Filled', 'Status', 'Scheduled', 'Created'];
        data = matches.map(m => [m.title, m.gameType, m.matchType, m.mode, m.entryFee, m.prizePool, m.maxSlots, m.filledSlots, m.status, m.scheduledAt?.toISOString(), m.createdAt?.toISOString()]);
        filename = 'matches_export.csv';
        break;
      }
      default:
        throw new BadRequestError('Invalid export type. Use: users, transactions, withdrawals, matches');
    }

    // Build CSV
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csv = [headers.join(','), ...data.map(row => row.map(escapeCsv).join(','))].join('\n');

    await AdminLog.log({
      admin: req.userId,
      action: 'data_export',
      targetType: 'system',
      description: `Exported ${type} data (${data.length} records)`,
      ip: req.ip,
      severity: 'medium'
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// Get online/connected users via Socket.io
exports.getOnlineUsers = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    if (!io) {
      return res.json({ success: true, onlineUsers: [], count: 0 });
    }

    const sockets = await io.fetchSockets();
    const userIds = [...new Set(sockets.map(s => s.userId).filter(Boolean))];

    const users = await User.find({ _id: { $in: userIds } })
      .select('name phone level role avatar lastLoginAt')
      .lean();

    // Add socket details
    const usersWithSocket = users.map(user => {
      const userSockets = sockets.filter(s => s.userId?.toString() === user._id.toString());
      return {
        ...user,
        connections: userSockets.length,
        rooms: userSockets.flatMap(s => [...s.rooms].filter(r => r !== s.id))
      };
    });

    res.json({
      success: true,
      count: userIds.length,
      totalConnections: sockets.length,
      onlineUsers: usersWithSocket
    });
  } catch (error) {
    next(error);
  }
};

// Get comprehensive dashboard summary (enhanced version)
exports.getDashboardEnhanced = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date(today);
    thisMonth.setDate(thisMonth.getDate() - 30);

    const [
      // User metrics
      totalUsers, newUsersToday, newUsersYesterday, newUsersThisWeek,
      bannedUsers, kycVerifiedUsers, activeUsersToday,
      // Match metrics
      totalMatches, activeMatches, liveMatches, completedMatchesToday,
      // Financial metrics
      todayRevenue, yesterdayRevenue, weekRevenue, monthRevenue,
      pendingWithdrawals, pendingWithdrawalAmount,
      todayDeposits,
      // Support metrics
      pendingKyc, openTickets, urgentTickets,
      pendingDisputes,
      // Recent activity
      recentActivity,
      // Online users
      recentLogins
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: yesterday, $lt: today } }),
      User.countDocuments({ createdAt: { $gte: thisWeek } }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isKycVerified: true }),
      User.countDocuments({ lastLoginAt: { $gte: today } }),

      Match.countDocuments(),
      Match.countDocuments({ status: { $in: ['upcoming', 'registration_open', 'live'] } }),
      Match.countDocuments({ status: 'live' }),
      Match.countDocuments({ status: 'completed', updatedAt: { $gte: today } }),

      // Today's revenue
      Transaction.aggregate([
        { $match: { type: 'debit', category: { $in: ['match_entry', 'tournament_entry'] }, createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      // Yesterday's revenue
      Transaction.aggregate([
        { $match: { type: 'debit', category: { $in: ['match_entry', 'tournament_entry'] }, createdAt: { $gte: yesterday, $lt: today } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // This week revenue
      Transaction.aggregate([
        { $match: { type: 'debit', category: { $in: ['match_entry', 'tournament_entry'] }, createdAt: { $gte: thisWeek } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // This month revenue
      Transaction.aggregate([
        { $match: { type: 'debit', category: { $in: ['match_entry', 'tournament_entry'] }, createdAt: { $gte: thisMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Withdrawal.countDocuments({ status: 'pending' }),
      Withdrawal.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      // Today's deposits
      Transaction.aggregate([
        { $match: { type: 'credit', category: 'deposit', status: 'completed', createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),

      KYC.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] }, priority: 'urgent' }),
      Dispute.countDocuments({ status: { $in: ['pending', 'under_review'] } }),

      AdminLog.find().sort({ createdAt: -1 }).limit(15).populate('admin', 'name role'),
      User.find({ lastLoginAt: { $gte: today } }).select('name level role lastLoginAt').sort({ lastLoginAt: -1 }).limit(10)
    ]);

    const todayRev = todayRevenue[0]?.total || 0;
    const yesterdayRev = yesterdayRevenue[0]?.total || 0;
    const revenueChange = yesterdayRev ? (((todayRev - yesterdayRev) / yesterdayRev) * 100).toFixed(1) : 0;
    const userChange = newUsersYesterday ? (((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      dashboard: {
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          banned: bannedUsers,
          kycVerified: kycVerifiedUsers,
          activeToday: activeUsersToday,
          growthPercent: parseFloat(userChange)
        },
        matches: {
          total: totalMatches,
          active: activeMatches,
          live: liveMatches,
          completedToday: completedMatchesToday
        },
        revenue: {
          today: todayRev,
          yesterday: yesterdayRev,
          thisWeek: weekRevenue[0]?.total || 0,
          thisMonth: monthRevenue[0]?.total || 0,
          changePercent: parseFloat(revenueChange),
          todayTransactions: todayRevenue[0]?.count || 0
        },
        deposits: {
          today: todayDeposits[0]?.total || 0,
          todayCount: todayDeposits[0]?.count || 0
        },
        withdrawals: {
          pending: pendingWithdrawals,
          pendingAmount: pendingWithdrawalAmount[0]?.total || 0
        },
        support: {
          pendingKyc,
          openTickets,
          urgentTickets,
          pendingDisputes
        },
        recentActivity,
        recentLogins
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get platform settings (configurable values)
exports.getPlatformSettings = async (req, res, next) => {
  try {
    // Return current environment-based settings
    const settings = {
      platform: {
        name: process.env.PLATFORM_NAME || 'BattleZone',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
      },
      financial: {
        minDeposit: parseInt(process.env.MIN_DEPOSIT) || 50,
        maxDeposit: parseInt(process.env.MAX_DEPOSIT) || 50000,
        minWithdrawal: parseInt(process.env.MIN_WITHDRAWAL) || 100,
        maxWithdrawal: parseInt(process.env.MAX_WITHDRAWAL) || 100000,
        tdsThreshold: parseInt(process.env.TDS_THRESHOLD) || 10000,
        tdsPercentage: parseInt(process.env.TDS_PERCENTAGE) || 30,
        platformCommission: parseInt(process.env.PLATFORM_COMMISSION) || 10,
        referralBonus: parseInt(process.env.REFERRAL_BONUS) || 50
      },
      match: {
        minEntryFee: parseInt(process.env.MIN_ENTRY_FEE) || 10,
        maxEntryFee: parseInt(process.env.MAX_ENTRY_FEE) || 10000,
        maxSlots: parseInt(process.env.MAX_SLOTS) || 100,
        autoRefundOnCancel: process.env.AUTO_REFUND !== 'false'
      },
      security: {
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
        otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
        maxOtpAttempts: parseInt(process.env.MAX_OTP_ATTEMPTS) || 3,
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15,
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
      },
      features: {
        kycRequired: process.env.KYC_REQUIRED !== 'false',
        pushNotifications: process.env.PUSH_ENABLED !== 'false',
        chatEnabled: process.env.CHAT_ENABLED !== 'false',
        tournamentsEnabled: process.env.TOURNAMENTS_ENABLED !== 'false',
        referralSystem: process.env.REFERRAL_ENABLED !== 'false'
      }
    };

    res.json({ success: true, settings });
  } catch (error) {
    next(error);
  }
};

// Get tournament management overview
exports.getTournamentOverview = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (status) query.status = status;

    const [tournaments, total, statusCounts] = await Promise.all([
      Tournament.find(query)
        .populate('createdBy', 'name role')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Tournament.countDocuments(query),
      Tournament.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      success: true,
      tournaments,
      summary: { byStatus: statusMap },
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

// Get all admin/staff users
exports.getAdminStaff = async (req, res, next) => {
  try {
    const staff = await User.find({
      role: { $in: ['admin', 'super_admin', 'support', 'match_manager', 'finance_manager'] }
    })
      .select('name email phone role isActive lastLoginAt createdAt avatar')
      .sort({ role: 1, name: 1 });

    // Get recent activity for each staff member
    const staffWithActivity = await Promise.all(
      staff.map(async (member) => {
        const recentActions = await AdminLog.countDocuments({
          admin: member._id,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        const lastAction = await AdminLog.findOne({ admin: member._id })
          .sort({ createdAt: -1 })
          .select('action description createdAt');

        return {
          ...member.toObject(),
          actionsThisWeek: recentActions,
          lastAction: lastAction || null
        };
      })
    );

    res.json({ success: true, staff: staffWithActivity, count: staff.length });
  } catch (error) {
    next(error);
  }
};

// Bulk user action (ban/unban/role change)
exports.bulkUserAction = async (req, res, next) => {
  try {
    const { userIds, action, value, reason } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestError('User IDs array is required');
    }
    if (!action) throw new BadRequestError('Action is required');

    const results = { success: 0, failed: 0, errors: [] };

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) { results.failed++; results.errors.push(`User ${userId} not found`); continue; }
        if (user.role === 'super_admin') { results.failed++; results.errors.push(`Cannot modify super admin ${user.name}`); continue; }

        switch (action) {
          case 'ban':
            user.isBanned = true;
            user.banReason = reason || 'Bulk admin action';
            user.bannedAt = new Date();
            user.bannedBy = req.userId;
            break;
          case 'unban':
            user.isBanned = false;
            user.banReason = undefined;
            user.bannedAt = undefined;
            user.bannedBy = undefined;
            break;
          case 'role':
            if (!['user', 'host', 'match_manager', 'finance_manager', 'support', 'admin'].includes(value)) {
              results.failed++;
              results.errors.push(`Invalid role for ${user.name}`);
              continue;
            }
            user.role = value;
            break;
          default:
            results.failed++;
            results.errors.push(`Unknown action: ${action}`);
            continue;
        }

        await user.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Error processing user ${userId}: ${err.message}`);
      }
    }

    await AdminLog.log({
      admin: req.userId,
      action: action === 'ban' ? 'user_ban' : action === 'unban' ? 'user_unban' : 'user_role_change',
      targetType: 'user',
      description: `Bulk ${action} on ${userIds.length} users. Success: ${results.success}, Failed: ${results.failed}`,
      newData: { userIds, action, value },
      ip: req.ip,
      severity: 'high'
    });

    res.json({ success: true, message: `Bulk action completed`, results });
  } catch (error) {
    next(error);
  }
};

// Get notification analytics
exports.getNotificationStats = async (req, res, next) => {
  try {
    const { period = '7d' } = req.query;
    let startDate = new Date();

    switch (period) {
      case '24h': startDate.setHours(startDate.getHours() - 24); break;
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
    }

    const [totalSent, byType, readRate, timeline] = await Promise.all([
      Notification.countDocuments({ createdAt: { $gte: startDate } }),
      Notification.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Notification.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            read: { $sum: { $cond: ['$isRead', 1, 0] } }
          }
        }
      ]),
      Notification.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    const readData = readRate[0] || { total: 0, read: 0 };

    res.json({
      success: true,
      stats: {
        totalSent,
        byType,
        readRate: readData.total ? ((readData.read / readData.total) * 100).toFixed(1) : 0,
        readCount: readData.read,
        unreadCount: readData.total - readData.read,
        timeline
      }
    });
  } catch (error) {
    next(error);
  }
};
