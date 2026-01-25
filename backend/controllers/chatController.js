const ChatMessage = require('../models/ChatMessage');
const Conversation = require('../models/Conversation');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');

// ==================== ROOM MESSAGES (Match/Tournament) ====================

// Create a new chat message (enhanced)
const createMessage = async (req, res) => {
  try {
    const { matchId, tournamentId, conversationId, content, replyTo, messageType = 'text' } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Validate at least one context is provided
    if (!matchId && !tournamentId && !conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Either matchId, tournamentId, or conversationId is required'
      });
    }

    // Validate replyTo message exists if provided
    if (replyTo) {
      const replyMessage = await ChatMessage.findById(replyTo);
      if (!replyMessage) {
        return res.status(400).json({ success: false, message: 'Reply message not found' });
      }
    }

    // For conversation messages, verify user is a participant
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ success: false, message: 'Conversation not found' });
      }
      if (!conversation.isParticipant(userId)) {
        return res.status(403).json({ success: false, message: 'Not authorized to send messages in this conversation' });
      }
      if (conversation.isBlockedBy(userId)) {
        return res.status(403).json({ success: false, message: 'You cannot send messages in this conversation' });
      }
    }

    const message = new ChatMessage({
      sender: userId,
      match: matchId || undefined,
      tournament: tournamentId || undefined,
      conversation: conversationId || undefined,
      content: content.trim(),
      messageType,
      replyTo: replyTo || undefined
    });

    await message.save();

    // Populate sender and replyTo for response
    await message.populate([
      { path: 'sender', select: 'name avatar' },
      { path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'name' } }
    ]);

    // Update conversation if it's a DM
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();

      // Increment unread for other participants
      conversation.participants.forEach(participantId => {
        if (participantId.toString() !== userId.toString()) {
          conversation.incrementUnread(participantId);
        }
      });

      await conversation.save();
    }

    // Emit the message to the appropriate room
    const io = req.app.get('io');
    if (matchId) {
      io.to(`match_${matchId}`).emit('new_message', message);
    } else if (tournamentId) {
      io.to(`tournament_${tournamentId}`).emit('new_message', message);
    } else if (conversationId) {
      io.to(`dm_${conversationId}`).emit('new_message', message);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
  }
};

// Get messages for a match (with pagination)
const getMatchMessages = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { limit = 50, before } = req.query;

    const query = { match: matchId, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .populate('sender', 'name avatar')
      .populate({ path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'name' } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(parseInt(limit))
      .lean();

    // Return in chronological order
    res.status(200).json({ success: true, data: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }
};

// Get messages for a tournament (with pagination)
const getTournamentMessages = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { limit = 50, before } = req.query;

    const query = { tournament: tournamentId, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .populate('sender', 'name avatar')
      .populate({ path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'name' } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({ success: true, data: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }
};

// ==================== DIRECT MESSAGES (DM) ====================

// Get user's conversations
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, skip = 0 } = req.query;

    const conversations = await Conversation.getUserConversations(
      userId,
      parseInt(limit),
      parseInt(skip)
    );

    // Add unread count for current user and format response
    const formattedConversations = conversations.map(conv => {
      const convObj = conv.toObject();
      convObj.unreadCount = conv.getUnreadCount(userId);
      convObj.otherParticipant = conv.getOtherParticipant(userId);
      return convObj;
    });

    res.status(200).json({ success: true, data: formattedConversations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch conversations', error: error.message });
  }
};

// Start or get existing DM conversation
const startConversation = async (req, res) => {
  try {
    const { userId: otherUserId } = req.body;
    const currentUserId = req.user._id;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    if (otherUserId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot start conversation with yourself' });
    }

    const conversation = await Conversation.findOrCreateDM(currentUserId, otherUserId);

    await conversation.populate('participants', 'name avatar');

    const convObj = conversation.toObject();
    convObj.otherParticipant = conversation.getOtherParticipant(currentUserId);
    convObj.unreadCount = conversation.getUnreadCount(currentUserId);

    res.status(200).json({ success: true, data: convObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to start conversation', error: error.message });
  }
};

// Get messages for a conversation
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user._id;

    // Verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
    }

    const query = { conversation: conversationId, isDeleted: false };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .populate('sender', 'name avatar')
      .populate({ path: 'replyTo', select: 'content sender', populate: { path: 'sender', select: 'name' } })
      .sort({ createdAt: -1, _id: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(200).json({ success: true, data: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
  }
};

// Mark conversation as read
const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    if (!conversation.isParticipant(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    conversation.resetUnread(userId);
    await conversation.save();

    // Also mark all messages as read
    await ChatMessage.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: { readBy: { user: userId, readAt: new Date() } }
      }
    );

    res.status(200).json({ success: true, message: 'Conversation marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
  }
};

// ==================== MESSAGE ACTIONS ====================

// Add reaction to message
const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required' });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    if (message.isDeleted) {
      return res.status(400).json({ success: false, message: 'Cannot react to deleted message' });
    }

    message.addReaction(userId, emoji);
    await message.save();

    // Emit reaction update
    const io = req.app.get('io');
    const roomId = message.match ? `match_${message.match}`
      : message.tournament ? `tournament_${message.tournament}`
        : `dm_${message.conversation}`;

    io.to(roomId).emit('reaction_added', {
      messageId,
      emoji,
      userId,
      reactions: message.reactions
    });

    res.status(200).json({ success: true, data: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add reaction', error: error.message });
  }
};

// Remove reaction from message
const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.removeReaction(userId, emoji);
    await message.save();

    // Emit reaction update
    const io = req.app.get('io');
    const roomId = message.match ? `match_${message.match}`
      : message.tournament ? `tournament_${message.tournament}`
        : `dm_${message.conversation}`;

    io.to(roomId).emit('reaction_removed', {
      messageId,
      emoji,
      userId,
      reactions: message.reactions
    });

    res.status(200).json({ success: true, data: message.reactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove reaction', error: error.message });
  }
};

// Edit message
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Can only edit your own messages' });
    }
    if (message.isDeleted) {
      return res.status(400).json({ success: false, message: 'Cannot edit deleted message' });
    }

    // Check if message is too old (allow edit within 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({ success: false, message: 'Can only edit messages within 15 minutes' });
    }

    message.editContent(content.trim());
    await message.save();

    await message.populate('sender', 'name avatar');

    // Emit edit update
    const io = req.app.get('io');
    const roomId = message.match ? `match_${message.match}`
      : message.tournament ? `tournament_${message.tournament}`
        : `dm_${message.conversation}`;

    io.to(roomId).emit('message_edited', {
      messageId,
      content: message.content,
      isEdited: true,
      editedAt: message.editedAt
    });

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to edit message', error: error.message });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const { isAdmin } = req.user;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Allow deletion by sender or admin
    if (message.sender.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Can only delete your own messages' });
    }

    message.softDelete(userId);
    await message.save();

    // Emit delete update
    const io = req.app.get('io');
    const roomId = message.match ? `match_${message.match}`
      : message.tournament ? `tournament_${message.tournament}`
        : `dm_${message.conversation}`;

    io.to(roomId).emit('message_deleted', { messageId });

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete message', error: error.message });
  }
};

// Mark single message as read
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Don't mark own messages as read
    if (message.sender.toString() === userId.toString()) {
      return res.status(200).json({ success: true, message: 'Own message' });
    }

    message.markAsRead(userId);
    await message.save();

    // Emit read receipt
    const io = req.app.get('io');
    const roomId = message.match ? `match_${message.match}`
      : message.tournament ? `tournament_${message.tournament}`
        : `dm_${message.conversation}`;

    io.to(roomId).emit('message_read', {
      messageId,
      userId,
      readAt: new Date()
    });

    res.status(200).json({ success: true, data: message.readBy });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read', error: error.message });
  }
};

// Get unread count across all conversations
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      totalUnread += conv.getUnreadCount(userId);
    });

    res.status(200).json({ success: true, data: { totalUnread } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get unread count', error: error.message });
  }
};

module.exports = {
  // Room messages
  createMessage,
  getMatchMessages,
  getTournamentMessages,
  // DM conversations
  getConversations,
  startConversation,
  getConversationMessages,
  markConversationAsRead,
  // Message actions
  addReaction,
  removeReaction,
  editMessage,
  deleteMessage,
  markMessageAsRead,
  getUnreadCount
};