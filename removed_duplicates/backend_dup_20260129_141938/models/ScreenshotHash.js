const mongoose = require('mongoose');

const screenshotHashSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  imageUrl: String,
  // Duplicate detection
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScreenshotHash'
  },
  isDuplicate: {
    type: Boolean,
    default: false
  },
  // EXIF metadata
  exifData: {
    make: String,
    model: String,
    software: String,
    dateTime: Date,
    gpsLatitude: Number,
    gpsLongitude: Number
  },
  // Analysis results
  isManipulated: {
    type: Boolean,
    default: false
  },
  manipulationDetails: String,
  // Status
  status: {
    type: String,
    enum: ['pending', 'verified', 'flagged', 'rejected'],
    default: 'pending'
  },
  flagReason: String,
  // Admin review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String
}, {
  timestamps: true
});

// Indexes (hash already indexed via index: true in schema)
screenshotHashSchema.index({ user: 1, match: 1 });
screenshotHashSchema.index({ isDuplicate: 1, status: 1 });

// Static: Check for duplicates
screenshotHashSchema.statics.checkDuplicate = async function(hash, userId, matchId) {
  // Find any existing screenshot with same hash
  const existing = await this.findOne({
    hash,
    _id: { $ne: matchId }
  });
  
  if (existing) {
    return {
      isDuplicate: true,
      originalUser: existing.user,
      originalMatch: existing.match,
      originalId: existing._id
    };
  }
  
  return { isDuplicate: false };
};

module.exports = mongoose.model('ScreenshotHash', screenshotHashSchema);
