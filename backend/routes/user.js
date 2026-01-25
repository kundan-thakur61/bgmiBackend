const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// Get user profile
router.get('/profile', auth, userController.getProfile);

// Update user profile
router.put('/profile', auth, userController.updateProfile);

// Update avatar
router.put('/avatar', auth, uploadSingle('avatar'), userController.updateAvatar);

// Update game profiles
router.put('/game-profiles', auth, userController.updateGameProfiles);

// Get user stats
router.get('/stats', auth, userController.getStats);

// Get user match history
router.get('/matches', auth, userController.getMatchHistory);

// Get user tournaments
router.get('/tournaments', auth, userController.getTournamentHistory);

// Get referral info
router.get('/referrals', auth, userController.getReferralInfo);

// Get notification preferences
router.get('/notification-preferences', auth, userController.getNotificationPreferences);

// Update notification preferences
router.put('/notification-preferences', auth, userController.updateNotificationPreferences);

// Update push subscription
router.post('/push-subscription', auth, userController.updatePushSubscription);

// Additional routes for frontend API consistency
router.get('/match-history', auth, userController.getMatchHistory);
router.get('/referral-stats', auth, userController.getReferralInfo);
router.post('/push-subscribe', auth, userController.updatePushSubscription);
router.post('/push-unsubscribe', auth, userController.removePushSubscription);
router.get('/search', auth, userController.searchUsers);

module.exports = router;

