const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { optionalAuth } = require('../middleware/auth');

// Public routes with optional auth (to get user's rank)
router.get('/', optionalAuth, leaderboardController.getGlobalLeaderboard);
router.get('/weekly', optionalAuth, leaderboardController.getWeeklyLeaderboard);
router.get('/monthly', optionalAuth, leaderboardController.getMonthlyLeaderboard);
router.get('/kills', optionalAuth, leaderboardController.getKillsLeaderboard);
router.get('/top-earners', leaderboardController.getTopEarners);

module.exports = router;
