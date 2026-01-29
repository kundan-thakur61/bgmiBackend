const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { auth, adminOnly } = require('../middleware/auth');
const { documentUpload } = require('../middleware/upload');

// User routes
router.get('/status', auth, kycController.getKycStatus);
router.post('/submit', auth, documentUpload.fields([
  { name: 'documentFront', maxCount: 1 },
  { name: 'documentBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'panDocument', maxCount: 1 }
]), kycController.submitKyc);
router.put('/resubmit', auth, documentUpload.fields([
  { name: 'documentFront', maxCount: 1 },
  { name: 'documentBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), kycController.resubmitKyc);

// Admin routes
router.get('/pending', auth, adminOnly, kycController.getPendingKyc);
router.get('/:id', auth, adminOnly, kycController.getKycDetails);
router.post('/:id/approve', auth, adminOnly, kycController.approveKyc);
router.post('/:id/reject', auth, adminOnly, kycController.rejectKyc);

module.exports = router;
