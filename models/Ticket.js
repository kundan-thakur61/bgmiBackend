const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ticketId: {
    type: String,
    unique: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    enum: ['payment', 'withdrawal', 'match', 'tournament', 'account', 'technical', 'report_user', 'other'],
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  // Related entities
  relatedMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  },
  relatedTournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  relatedTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  relatedWithdrawal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Withdrawal'
  },
  // Messages thread
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderType: {
      type: String,
      enum: ['user', 'admin'],
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000
    },
    attachments: [{
      url: String,
      publicId: String,
      type: String,
      name: String
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    isRead: {
      type: Boolean,
      default: false
    }
  }],
  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  // Resolution
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolution: String,
  // User satisfaction
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: String,
  // Metadata
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  firstResponseAt: Date,
  // Auto-close
  autoCloseAt: Date
}, {
  timestamps: true
});

// Indexes (ticketId already indexed via unique: true)
ticketSchema.index({ user: 1, status: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: -1, createdAt: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

// Generate ticket ID before save
ticketSchema.pre('save', function(next) {
  if (!this.ticketId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `BZ${year}${month}${random}`;
  }
  next();
});

// Add message to ticket
ticketSchema.methods.addMessage = function(senderId, senderType, message, attachments = []) {
  this.messages.push({
    sender: senderId,
    senderType,
    message,
    attachments
  });
  
  this.lastActivityAt = new Date();
  
  // Set first response time if admin is responding
  if (senderType === 'admin' && !this.firstResponseAt) {
    this.firstResponseAt = new Date();
  }
  
  return this;
};

// Assign ticket
ticketSchema.methods.assign = function(adminId) {
  this.assignedTo = adminId;
  this.assignedAt = new Date();
  if (this.status === 'open') {
    this.status = 'in_progress';
  }
  return this;
};

// Resolve ticket
ticketSchema.methods.resolve = function(adminId, resolution) {
  this.status = 'resolved';
  this.resolvedBy = adminId;
  this.resolvedAt = new Date();
  this.resolution = resolution;
  
  // Set auto-close after 7 days if no response
  this.autoCloseAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  return this;
};

// Close ticket
ticketSchema.methods.close = function() {
  this.status = 'closed';
  return this;
};

// Rate ticket
ticketSchema.methods.rate = function(rating, feedback = '') {
  this.rating = rating;
  this.feedback = feedback;
  return this;
};

module.exports = mongoose.model('Ticket', ticketSchema);
