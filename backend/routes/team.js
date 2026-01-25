const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { auth } = require('../middleware/auth');

// All routes require auth
router.use(auth);

// Team routes
router.get('/my', teamController.getMyTeams);
router.get('/invites', teamController.getMyInvites);
router.get('/:id', teamController.getTeam);
router.post('/', teamController.createTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.disbandTeam);

// Member management
router.post('/:id/invite', teamController.inviteMember);
router.post('/:id/accept', teamController.acceptInvite);
router.post('/:id/decline', teamController.declineInvite);
router.post('/:id/leave', teamController.leaveTeam);
router.post('/:id/remove', teamController.removeMember);
router.post('/:id/transfer', teamController.transferCaptaincy);

module.exports = router;
