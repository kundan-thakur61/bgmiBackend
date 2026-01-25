const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const { auth, supportAccess } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// All routes require auth
router.use(auth);

// User routes
router.post('/', disputeController.createDispute);
router.get('/my', disputeController.getMyDisputes);
router.get('/:id', disputeController.getDispute);
router.post('/:id/message', disputeController.addMessage);
router.post('/:id/evidence', uploadSingle('evidence'), disputeController.uploadEvidence);

// Admin routes
router.get('/admin/all', supportAccess, disputeController.getAllDisputes);
router.post('/:id/assign', supportAccess, disputeController.assignDispute);
router.post('/:id/resolve', supportAccess, disputeController.resolveDispute);
router.post('/:id/note', supportAccess, disputeController.addAdminNote);

module.exports = router;
