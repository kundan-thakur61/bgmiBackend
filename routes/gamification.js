const express = require('express');
const router = express.Router();
const { auth: protect } = require('../middleware/auth');
const {
    getMissions,
    startMission,
    updateMissionProgress,
    claimMissionReward,
    getUserProgress,
    getSeasonPass,
    claimSeasonReward,
    purchaseSeasonPass,
    getLevelLeaderboard
} = require('../controllers/gamificationController');

// Missions
router.get('/missions', protect, getMissions);
router.post('/missions/:missionId/start', protect, startMission);
router.put('/missions/:missionId/progress', protect, updateMissionProgress);
router.post('/missions/:missionId/claim', protect, claimMissionReward);

// User progress
router.get('/progress', protect, getUserProgress);

// Seasonal pass
router.get('/season-pass', protect, getSeasonPass);
router.post('/season-pass/claim/:tier', protect, claimSeasonReward);
router.post('/season-pass/purchase', protect, purchaseSeasonPass);

// Leaderboard
router.get('/leaderboard', getLevelLeaderboard);

module.exports = router;
