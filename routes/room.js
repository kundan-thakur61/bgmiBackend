const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const roomController = require('../controllers/roomController');

// Public routes
router.get('/', roomController.getRooms);
router.get('/code/:code', roomController.getRoomByCode);
router.get('/:id', roomController.getRoomById);

// Protected routes (require authentication)
router.post('/', auth, roomController.createRoom);
router.post('/:id/join', auth, roomController.joinRoom);
router.post('/:id/leave', auth, roomController.leaveRoom);
router.patch('/:id/settings', auth, roomController.updateRoomSettings);
router.post('/:id/start', auth, roomController.startRoom);
router.post('/:id/close', auth, roomController.closeRoom);
router.delete('/:id/kick/:userId', auth, roomController.kickParticipant);

module.exports = router;
