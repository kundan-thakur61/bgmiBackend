const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Public routes
router.get('/', searchController.search);
router.get('/matches', searchController.searchMatches);
router.get('/tournaments', searchController.searchTournaments);
router.get('/players', searchController.searchPlayers);

module.exports = router;
