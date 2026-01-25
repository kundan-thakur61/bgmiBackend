const { User, Match, Tournament, Transaction, Withdrawal, KYC, Ticket, Announcement, AdminLog } = require('../models');
const { BadRequestError, NotFoundError } = require('../middleware/errorHandler');

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
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';
    
    const users = await User.find(query)
      .select('-otp -password -deviceFingerprints')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
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
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
