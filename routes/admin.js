const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const prizeDistributionController = require('../controllers/prizeDistributionController');
const { auth, adminOnly, authorize, financeAccess, supportAccess, matchManagerAccess } = require('../middleware/auth');

// =====================================================
// DASHBOARD & SYSTEM
// =====================================================
router.get('/dashboard', auth, adminOnly, adminController.getDashboard);
router.get('/dashboard/enhanced', auth, adminOnly, adminController.getDashboardEnhanced);
router.get('/stats', auth, adminOnly, adminController.getStats);
router.get('/system/health', auth, adminOnly, adminController.getSystemHealth);
router.get('/system/online-users', auth, adminOnly, adminController.getOnlineUsers);
router.get('/system/settings', auth, adminOnly, adminController.getPlatformSettings);

// =====================================================
// USER MANAGEMENT
// =====================================================
router.get('/users', auth, adminOnly, adminController.getUsers);
router.get('/users/:id', auth, adminOnly, adminController.getUser);
router.put('/users/:id', auth, adminOnly, adminController.updateUser);
router.post('/users/:id/ban', auth, adminOnly, adminController.banUser);
router.post('/users/:id/unban', auth, adminOnly, adminController.unbanUser);
router.post('/users/:id/role', auth, authorize('super_admin'), adminController.changeUserRole);
router.post('/users/:id/wallet', auth, adminOnly, adminController.adjustWallet);
router.post('/users/:id/force-logout', auth, adminOnly, adminController.forceLogoutUser);
router.post('/users/bulk-action', auth, adminOnly, adminController.bulkUserAction);

// =====================================================
// STAFF MANAGEMENT
// =====================================================
router.get('/staff', auth, adminOnly, adminController.getAdminStaff);

// =====================================================
// FINANCIAL MANAGEMENT
// =====================================================
router.get('/transactions', auth, financeAccess, adminController.getTransactionHistory);
router.get('/withdrawals/queue', auth, financeAccess, adminController.getWithdrawalQueue);

// =====================================================
// KYC MANAGEMENT
// =====================================================
router.get('/kyc/queue', auth, supportAccess, adminController.getKycQueue);

// =====================================================
// MATCH & TOURNAMENT MANAGEMENT
// =====================================================
router.get('/matches/overview', auth, matchManagerAccess, adminController.getMatchOverview);
router.get('/tournaments/overview', auth, matchManagerAccess, adminController.getTournamentOverview);

// =====================================================
// TICKET & DISPUTE MANAGEMENT
// =====================================================
router.get('/tickets/overview', auth, supportAccess, adminController.getTicketOverview);
router.get('/disputes/overview', auth, supportAccess, adminController.getDisputeOverview);
router.get('/disputes/stats', auth, adminOnly, adminController.getDisputeStats);
router.post('/disputes/:id/assign', auth, adminOnly, adminController.assignDispute);
router.post('/disputes/:id/resolve', auth, adminOnly, adminController.resolveDispute);
router.post('/disputes/:id/note', auth, supportAccess, adminController.addDisputeNote);

// =====================================================
// ACTIVITY LOGS
// =====================================================
router.get('/logs', auth, adminOnly, adminController.getLogs);
router.get('/logs/my-activity', auth, adminOnly, adminController.getMyActivity);

// =====================================================
// ANNOUNCEMENTS
// =====================================================
router.get('/announcements', auth, adminOnly, adminController.getAnnouncements);
router.post('/announcements', auth, adminOnly, adminController.createAnnouncement);
router.put('/announcements/:id', auth, adminOnly, adminController.updateAnnouncement);
router.delete('/announcements/:id', auth, adminOnly, adminController.deleteAnnouncement);

// =====================================================
// REPORTS & ANALYTICS
// =====================================================
router.get('/reports/revenue', auth, financeAccess, adminController.getRevenueReport);
router.get('/reports/users', auth, adminOnly, adminController.getUserReport);
router.get('/reports/matches', auth, matchManagerAccess, adminController.getMatchReport);
router.get('/reports/referrals', auth, adminOnly, adminController.getReferralStats);
router.get('/analytics/users', auth, adminOnly, adminController.getUserGrowthAnalytics);
router.get('/analytics/revenue', auth, financeAccess, adminController.getRevenueAnalytics);
router.get('/analytics/notifications', auth, adminOnly, adminController.getNotificationStats);

// =====================================================
// DATA EXPORT
// =====================================================
router.get('/export', auth, adminOnly, adminController.exportData);

// =====================================================
// BROADCAST NOTIFICATIONS
// =====================================================
router.post('/broadcast', auth, adminOnly, adminController.broadcastNotification);

// =====================================================
// PRIZE DISTRIBUTION RULES & REGULATIONS
// =====================================================
// Get all rules
router.get('/prize-rules', auth, matchManagerAccess, prizeDistributionController.getRules);

// Get rule statistics
router.get('/prize-rules/stats', auth, matchManagerAccess, prizeDistributionController.getRuleStats);

// Get single rule
router.get('/prize-rules/:id', auth, matchManagerAccess, prizeDistributionController.getRule);

// Create new rule
router.post('/prize-rules', auth, matchManagerAccess, prizeDistributionController.createRule);

// Update rule
router.put('/prize-rules/:id', auth, matchManagerAccess, prizeDistributionController.updateRule);

// Delete rule
router.delete('/prize-rules/:id', auth, authorize('super_admin', 'admin'), prizeDistributionController.deleteRule);

// Toggle rule status
router.patch('/prize-rules/:id/toggle', auth, matchManagerAccess, prizeDistributionController.toggleRuleStatus);

// Set default rule
router.patch('/prize-rules/:id/default', auth, authorize('super_admin', 'admin'), prizeDistributionController.setDefaultRule);

// Get rule version history
router.get('/prize-rules/:id/history', auth, matchManagerAccess, prizeDistributionController.getRuleHistory);

// Restore rule to previous version
router.post('/prize-rules/:id/restore/:version', auth, authorize('super_admin', 'admin'), prizeDistributionController.restoreRuleVersion);

// Duplicate a rule
router.post('/prize-rules/:id/duplicate', auth, matchManagerAccess, prizeDistributionController.duplicateRule);

// Preview distribution for a match
router.get('/prize-rules/:ruleId/preview/:matchId', auth, matchManagerAccess, prizeDistributionController.previewDistribution);

// Get applicable rule for a match
router.get('/prize-rules/match/:matchId/applicable', auth, matchManagerAccess, prizeDistributionController.getApplicableRule);

// Bulk update rules
router.patch('/prize-rules/bulk', auth, authorize('super_admin', 'admin'), prizeDistributionController.bulkUpdateRules);

module.exports = router;

