const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'promotion'],
    default: 'info'
  },
  placement: {
    type: String,
    enum: ['banner', 'popup', 'notification', 'all'],
    default: 'banner'
  },
  // Target audience
  targetAudience: {
    type: String,
    enum: ['all', 'verified_only', 'kyc_verified', 'specific_level'],
    default: 'all'
  },
  targetLevels: [{
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  }],
  // Styling
  backgroundColor: String,
  textColor: String,
  icon: String,
  // Action
  actionUrl: String,
  actionText: String,
  // Schedule
  startAt: {
    type: Date,
    default: Date.now
  },
  endAt: Date,
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isDismissible: {
    type: Boolean,
    default: true
  },
  // Admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Stats
  viewCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
  },
  dismissCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
announcementSchema.index({ isActive: 1, startAt: 1, endAt: 1 });
announcementSchema.index({ placement: 1, isActive: 1 });

// Static: Get active announcements
announcementSchema.statics.getActive = function(placement = null) {
  const now = new Date();
  const query = {
    isActive: true,
    startAt: { $lte: now },
    $or: [
      { endAt: { $gte: now } },
      { endAt: null }
    ]
  };
  
  if (placement) {
    query.$or = [
      { placement },
      { placement: 'all' }
    ];
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Announcement', announcementSchema);
