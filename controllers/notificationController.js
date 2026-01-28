const { Notification } = require('../models');
const { NotFoundError } = require('../middleware/errorHandler');

// Get notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { user: req.userId };
    if (unreadOnly === 'true') query.isRead = false;
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(req.userId);
    
    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// Get unread count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.getUnreadCount(req.userId);
    res.json({ success: true, unreadCount: count });
  } catch (error) {
    next(error);
  }
};

// Mark as read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) throw new NotFoundError('Notification not found');
    
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.markAllRead(req.userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Delete notification
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!notification) throw new NotFoundError('Notification not found');
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};
