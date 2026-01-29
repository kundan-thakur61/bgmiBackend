const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_ban',
      'user_unban',
      'user_role_change',
      'wallet_credit',
      'wallet_debit',
      'match_create',
      'match_update',
      'match_cancel',
      'match_result_verify',
      'tournament_create',
      'tournament_update',
      'tournament_cancel',
      'withdrawal_approve',
      'withdrawal_reject',
      'kyc_approve',
      'kyc_reject',
      'ticket_assign',
      'ticket_resolve',
      'announcement_create',
      'announcement_update',
      'settings_update',
      'login',
      'other'
    ],
    index: true
  },
  targetType: {
    type: String,
    enum: ['user', 'match', 'tournament', 'withdrawal', 'kyc', 'ticket', 'announcement', 'settings', 'other']
  },
  targetId: mongoose.Schema.Types.ObjectId,
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  // Before/After data for auditing
  previousData: mongoose.Schema.Types.Mixed,
  newData: mongoose.Schema.Types.Mixed,
  // Request metadata
  ip: String,
  userAgent: String,
  // Severity
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes
adminLogSchema.index({ admin: 1, createdAt: -1 });
adminLogSchema.index({ action: 1, createdAt: -1 });
adminLogSchema.index({ targetType: 1, targetId: 1 });
adminLogSchema.index({ severity: 1, createdAt: -1 });

// Static: Log admin action
adminLogSchema.statics.log = function(data) {
  return this.create(data);
};

// Static: Get admin activity
adminLogSchema.statics.getAdminActivity = function(adminId, options = {}) {
  const { page = 1, limit = 50, action, startDate, endDate } = options;
  
  const query = { admin: adminId };
  if (action) query.action = action;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('admin', 'name email role');
};

module.exports = mongoose.model('AdminLog', adminLogSchema);
