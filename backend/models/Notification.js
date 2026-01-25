const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'match',
      'match_reminder',
      'match_starting',
      'room_released',
      'match_completed',
      'match_cancelled',
      'result_verified',
      'tournament_reminder',
      'tournament_starting',
      'prize_credited',
      'withdrawal_approved',
      'withdrawal_rejected',
      'kyc_approved',
      'kyc_rejected',
      'deposit_success',
      'referral_bonus',
      'level_up',
      'announcement',
      'ticket_response',
      'ban_warning',
      'system'
    ],
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  // Related entity
  reference: {
    type: {
      type: String,
      enum: ['match', 'tournament', 'transaction', 'withdrawal', 'ticket', 'kyc']
    },
    id: mongoose.Schema.Types.ObjectId
  },
  // Action URL
  actionUrl: String,
  actionText: String,
  // Visual
  icon: String,
  imageUrl: String,
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  // Push notification
  isPushed: {
    type: Boolean,
    default: false
  },
  pushedAt: Date,
  pushError: String,
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  // Expiry
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static: Create and optionally push notification
notificationSchema.statics.createAndPush = async function(data) {
  const notification = await this.create(data);
  
  // TODO: Implement push notification logic
  // const User = mongoose.model('User');
  // const user = await User.findById(data.user);
  // if (user.pushSubscription) {
  //   await sendPushNotification(user.pushSubscription, notification);
  // }
  
  return notification;
};

// Static: Create notification (simplified version)
notificationSchema.statics.createNotification = async function(userId, type, title, message, data = {}) {
  return this.create({
    user: userId,
    type,
    title,
    message,
    reference: data.matchId ? { type: 'match', id: data.matchId } : undefined,
    actionUrl: data.matchId ? `/matches/${data.matchId}` : data.actionUrl,
    actionText: data.actionText || 'View',
    priority: data.priority || 'normal'
  });
};

// Static: Mark all as read for user
notificationSchema.statics.markAllRead = function(userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static: Get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

// Static: Create match reminder notifications
notificationSchema.statics.createMatchReminders = async function(match) {
  const notifications = match.joinedUsers.map(ju => ({
    user: ju.user,
    type: 'match_reminder',
    title: 'Match Starting Soon',
    message: `Your match "${match.title}" is starting in 15 minutes. Get ready!`,
    reference: { type: 'match', id: match._id },
    actionUrl: `/matches/${match._id}`,
    actionText: 'View Match',
    priority: 'high'
  }));
  
  return this.insertMany(notifications);
};

// Static: Notify room credentials released
notificationSchema.statics.notifyRoomReleased = async function(match) {
  const notifications = match.joinedUsers.map(ju => ({
    user: ju.user,
    type: 'room_released',
    title: 'Room Details Available',
    message: `Room ID and Password for "${match.title}" are now available. Join now!`,
    reference: { type: 'match', id: match._id },
    actionUrl: `/matches/${match._id}`,
    actionText: 'Get Room Details',
    priority: 'high'
  }));
  
  return this.insertMany(notifications);
};

module.exports = mongoose.model('Notification', notificationSchema);
