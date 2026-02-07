const express = require('express');
const router = express.Router();
const { auth: protect } = require('../middleware/auth');
const {
    getPlayerStats,
    getMyStats,
    getLeaderboard,
    getMatchStatistics,
    getPerformanceComparison,
    getTournamentInsights,
    getPerformanceTrends
} = require('../controllers/analyticsController');

// Player statistics
router.get('/me', protect, getMyStats);
router.get('/player/:userId', protect, getPlayerStats);

// Leaderboards
router.get('/leaderboard', getLeaderboard);

// Match analytics
router.get('/match/:matchId', protect, getMatchStatistics);

// Performance insights
router.get('/compare', protect, getPerformanceComparison);
router.get('/tournaments', protect, getTournamentInsights);
router.get('/trends', protect, getPerformanceTrends);

module.exports = router;
