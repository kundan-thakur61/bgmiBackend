const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { auth, optionalAuth, adminOnly, matchManagerAccess } = require('../middleware/auth');
const { screenshotUpload } = require('../middleware/upload');
const { validationChains } = require('../middleware/validators');

// Public routes
router.get('/', optionalAuth, matchController.getMatches);
router.get('/upcoming', matchController.getUpcomingMatches);
router.get('/live', matchController.getLiveMatches);
router.get('/:id', optionalAuth, matchController.getMatch);

// Protected routes (requires auth)
router.post('/:id/join', auth, matchController.joinMatch);
router.post('/:id/leave', auth, matchController.leaveMatch);
router.get('/:id/room', auth, matchController.getRoomCredentials);
router.post('/:id/screenshot', auth, screenshotUpload.single('screenshot'), matchController.uploadScreenshot);
router.get('/:id/my-status', auth, matchController.getMyMatchStatus);

// Admin/Manager routes
router.post('/', auth, matchManagerAccess, validationChains.createMatch, matchController.createMatch);
router.put('/:id', auth, matchManagerAccess, matchController.updateMatch);
router.delete('/:id', auth, adminOnly, matchController.deleteMatch);
router.post('/:id/room-credentials', auth, matchManagerAccess, matchController.setRoomCredentials);
router.post('/:id/start', auth, matchManagerAccess, matchController.startMatch);
router.post('/:id/complete', auth, matchManagerAccess, matchController.completeMatch);
router.post('/:id/cancel', auth, matchManagerAccess, matchController.cancelMatch);
router.post('/:id/verify-result', auth, matchManagerAccess, matchController.verifyResult);
router.get('/:id/screenshots', auth, matchManagerAccess, matchController.getAllScreenshots);

module.exports = router;
