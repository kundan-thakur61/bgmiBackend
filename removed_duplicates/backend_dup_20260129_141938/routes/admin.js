const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, adminOnly, authorize } = require('../middleware/auth');

// Dashboard
router.get('/dashboard', auth, adminOnly, adminController.getDashboard);
router.get('/stats', auth, adminOnly, adminController.getStats);

// User Management
router.get('/users', auth, adminOnly, adminController.getUsers);
router.get('/users/:id', auth, adminOnly, adminController.getUser);
router.put('/users/:id', auth, adminOnly, adminController.updateUser);
router.post('/users/:id/ban', auth, adminOnly, adminController.banUser);
router.post('/users/:id/unban', auth, adminOnly, adminController.unbanUser);
router.post('/users/:id/role', auth, authorize('super_admin'), adminController.changeUserRole);
router.post('/users/:id/wallet', auth, adminOnly, adminController.adjustWallet);

// Activity Logs
router.get('/logs', auth, adminOnly, adminController.getLogs);
router.get('/logs/my-activity', auth, adminOnly, adminController.getMyActivity);

// Announcements
router.get('/announcements', auth, adminOnly, adminController.getAnnouncements);
router.post('/announcements', auth, adminOnly, adminController.createAnnouncement);
router.put('/announcements/:id', auth, adminOnly, adminController.updateAnnouncement);
router.delete('/announcements/:id', auth, adminOnly, adminController.deleteAnnouncement);

// Reports
router.get('/reports/revenue', auth, adminOnly, adminController.getRevenueReport);
router.get('/reports/users', auth, adminOnly, adminController.getUserReport);
router.get('/reports/matches', auth, adminOnly, adminController.getMatchReport);
router.get('/reports/referrals', auth, adminOnly, adminController.getReferralStats);

// Disputes
router.get('/disputes/stats', auth, adminOnly, adminController.getDisputeStats);

// Broadcast Notifications
router.post('/broadcast', auth, adminOnly, adminController.broadcastNotification);

module.exports = router;

