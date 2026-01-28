const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Room context (one of these should be set)
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },

  // Message content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },

  // Message type
  messageType: {
    type: String,
    enum: ['text', 'image', 'system'],
    default: 'text'
  },

  // Reply support (threading)
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  },

  // Emoji reactions
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],

  // Read receipts
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Edit support
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Soft delete support
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chatMessageSchema.index({ match: 1, createdAt: -1 });
chatMessageSchema.index({ tournament: 1, createdAt: -1 });
chatMessageSchema.index({ conversation: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1, createdAt: -1 });

// Virtual to get reaction count
chatMessageSchema.virtual('reactionCount').get(function () {
  return this.reactions.reduce((total, reaction) => total + reaction.users.length, 0);
});

// Method to add a reaction
chatMessageSchema.methods.addReaction = function (userId, emoji) {
  const existingReaction = this.reactions.find(r => r.emoji === emoji);

  if (existingReaction) {
    // Check if user already reacted with this emoji
    const userIndex = existingReaction.users.findIndex(
      u => u.toString() === userId.toString()
    );
    if (userIndex === -1) {
      existingReaction.users.push(userId);
    }
  } else {
    this.reactions.push({ emoji, users: [userId] });
  }

  return this;
};

// Method to remove a reaction
chatMessageSchema.methods.removeReaction = function (userId, emoji) {
  const reactionIndex = this.reactions.findIndex(r => r.emoji === emoji);

  if (reactionIndex !== -1) {
    const userIndex = this.reactions[reactionIndex].users.findIndex(
      u => u.toString() === userId.toString()
    );

    if (userIndex !== -1) {
      this.reactions[reactionIndex].users.splice(userIndex, 1);

      // Remove reaction object if no users left
      if (this.reactions[reactionIndex].users.length === 0) {
        this.reactions.splice(reactionIndex, 1);
      }
    }
  }

  return this;
};

// Method to mark as read by a user
chatMessageSchema.methods.markAsRead = function (userId) {
  const alreadyRead = this.readBy.some(
    r => r.user.toString() === userId.toString()
  );

  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }

  return this;
};

// Method to edit message
chatMessageSchema.methods.editContent = function (newContent) {
  // Store old content in history
  if (this.content !== newContent) {
    this.editHistory.push({ content: this.content, editedAt: new Date() });
    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
  }

  return this;
};

// Method to soft delete
chatMessageSchema.methods.softDelete = function (deletedByUserId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedByUserId;
  return this;
};

// Transform for JSON (hide deleted message content)
chatMessageSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    if (ret.isDeleted) {
      ret.content = 'This message was deleted';
      delete ret.reactions;
    }
    return ret;
  }
});

chatMessageSchema.set('toObject', { virtuals: true });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;