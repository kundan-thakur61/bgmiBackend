const express = require('express');
const router = express.Router();
const { auth: protect } = require('../middleware/auth');
const {
    sendFriendRequest,
    respondToFriendRequest,
    getFriends,
    getOnlineFriends,
    getPendingRequests,
    removeFriend,
    blockUser,
    inviteToMatch,
    searchUsers
} = require('../controllers/socialController');

// Friend management
router.post('/friends/request', protect, sendFriendRequest);
router.put('/friends/request/:friendshipId', protect, respondToFriendRequest);
router.get('/friends', protect, getFriends);
router.get('/friends/online', protect, getOnlineFriends);
router.get('/friends/requests', protect, getPendingRequests);
router.delete('/friends/:friendshipId', protect, removeFriend);

// Blocking
router.post('/block/:userId', protect, blockUser);

// Invitations
router.post('/invite/match', protect, inviteToMatch);

// User search
router.get('/users/search', protect, searchUsers);

module.exports = router;
