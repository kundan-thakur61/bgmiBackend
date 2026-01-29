const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { auth, adminOnly, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, achievementController.getAllAchievements);

// Protected routes
router.get('/my', auth, achievementController.getMyAchievements);
router.post('/check', auth, achievementController.checkMyAchievements);

// Admin routes
router.post('/seed', auth, adminOnly, achievementController.seedAchievements);
router.post('/', auth, adminOnly, achievementController.createAchievement);
router.put('/:id', auth, adminOnly, achievementController.updateAchievement);
router.delete('/:id', auth, adminOnly, achievementController.deleteAchievement);

module.exports = router;
