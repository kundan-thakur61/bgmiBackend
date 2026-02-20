const express = require('express');
const router = express.Router();
const playerAnalyticsController = require('../controllers/playerAnalyticsController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Dashboard
router.get('/dashboard', playerAnalyticsController.getDashboard);

// Performance charts
router.get('/performance-chart', playerAnalyticsController.getPerformanceChart);
router.get('/earnings-chart', playerAnalyticsController.getEarningsChart);

// Performance breakdown
router.get('/map-performance', playerAnalyticsController.getMapPerformance);
router.get('/mode-performance', playerAnalyticsController.getModePerformance);
router.get('/weapon-stats', playerAnalyticsController.getWeaponStats);
router.get('/time-based-performance', playerAnalyticsController.getTimeBasedPerformance);

// Trends and insights
router.get('/performance-trends', playerAnalyticsController.getPerformanceTrends);
router.get('/insights', playerAnalyticsController.getInsights);
router.get('/engagement', playerAnalyticsController.getEngagementMetrics);
router.get('/comparative-stats', playerAnalyticsController.getComparativeStats);

// Match history
router.get('/match-history', playerAnalyticsController.getMatchHistory);

// Update analytics (internal use)
router.post('/update', playerAnalyticsController.updateAnalytics);

module.exports = router;
