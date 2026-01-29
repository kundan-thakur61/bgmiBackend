const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { auth, optionalAuth, adminOnly, matchManagerAccess } = require('../middleware/auth');

// Public routes
router.get('/', optionalAuth, tournamentController.getTournaments);
router.get('/featured', tournamentController.getFeaturedTournaments);
router.get('/:id', optionalAuth, tournamentController.getTournament);
router.get('/:id/leaderboard', tournamentController.getLeaderboard);

// Protected routes
router.post('/:id/register', auth, tournamentController.registerForTournament);
router.post('/:id/leave', auth, tournamentController.leaveTournament);
router.get('/:id/my-status', auth, tournamentController.getMyTournamentStatus);

// Admin routes
router.post('/', auth, matchManagerAccess, tournamentController.createTournament);
router.put('/:id', auth, matchManagerAccess, tournamentController.updateTournament);
router.delete('/:id', auth, adminOnly, tournamentController.deleteTournament);
router.post('/:id/update-standings', auth, matchManagerAccess, tournamentController.updateStandings);
router.post('/:id/complete', auth, matchManagerAccess, tournamentController.completeTournament);
router.post('/:id/cancel', auth, matchManagerAccess, tournamentController.cancelTournament);

module.exports = router;
