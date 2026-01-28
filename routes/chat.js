const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth } = require('../middleware/auth');

// ==================== ROOM MESSAGES ====================

// Send a message (works for match, tournament, or DM)
router.post('/send', auth, chatController.createMessage);

// Get messages for a match
router.get('/match/:matchId', auth, chatController.getMatchMessages);

// Get messages for a tournament
router.get('/tournament/:tournamentId', auth, chatController.getTournamentMessages);

// ==================== DIRECT MESSAGES ====================

// Get user's DM conversations
router.get('/conversations', auth, chatController.getConversations);

// Start or get existing DM conversation
router.post('/conversations', auth, chatController.startConversation);

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', auth, chatController.getConversationMessages);

// Mark conversation as read
router.post('/conversations/:conversationId/read', auth, chatController.markConversationAsRead);

// Get total unread count
router.get('/unread', auth, chatController.getUnreadCount);

// ==================== MESSAGE ACTIONS ====================

// Add reaction to message
router.post('/messages/:messageId/react', auth, chatController.addReaction);

// Remove reaction from message
router.delete('/messages/:messageId/react', auth, chatController.removeReaction);

// Edit message
router.patch('/messages/:messageId', auth, chatController.editMessage);

// Delete message
router.delete('/messages/:messageId', auth, chatController.deleteMessage);

// Mark message as read
router.post('/messages/:messageId/read', auth, chatController.markMessageAsRead);

module.exports = router;