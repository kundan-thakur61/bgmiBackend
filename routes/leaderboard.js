const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuth, adminOnly } = require('../middleware/auth');

// Public routes with optional auth (to get user's rank)
router.get('/', optionalAuth, leaderboardController.getGlobalLeaderboard);
router.get('/weekly', optionalAuth, leaderboardController.getWeeklyLeaderboard);
router.get('/monthly', optionalAuth, leaderboardController.getMonthlyLeaderboard);
router.get('/kills', optionalAuth, leaderboardController.getKillsLeaderboard);
router.get('/top-earners', leaderboardController.getTopEarners);

// Admin routes for leaderboard management
router.put('/admin/user/:userId/stats', adminOnly, leaderboardController.updateUserStats);
router.post('/admin/user/:userId/add', adminOnly, leaderboardController.addUserToLeaderboard);
router.delete('/admin/user/:userId/remove', adminOnly, leaderboardController.removeUserFromLeaderboard);
router.post('/admin/reset/weekly', adminOnly, leaderboardController.resetWeeklyLeaderboard);
router.post('/admin/reset/monthly', adminOnly, leaderboardController.resetMonthlyLeaderboard);
router.post('/admin/archive', adminOnly, leaderboardController.archiveLeaderboard);
router.get('/admin/archives', adminOnly, leaderboardController.getArchivedLeaderboards);
router.get('/admin/archives/:archiveId', adminOnly, leaderboardController.getArchivedLeaderboard);
router.delete('/admin/clear-all', adminOnly, leaderboardController.clearAllLeaderboardData);

module.exports = router;

