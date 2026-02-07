const express = require('express');
const router = express.Router();
const { auth: protect } = require('../middleware/auth');
const {
    setup2FA,
    enable2FA,
    verify2FA,
    disable2FA,
    get2FAStatus,
    getSecurityLogs,
    getTrustedDevices,
    removeTrustedDevice,
    checkSuspiciousActivity
} = require('../controllers/securityController');

// 2FA management
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/enable', protect, enable2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.get('/2fa/status', protect, get2FAStatus);

// Security logs
router.get('/logs', protect, getSecurityLogs);

// Trusted devices
router.get('/devices', protect, getTrustedDevices);
router.delete('/devices/:deviceId', protect, removeTrustedDevice);

// Suspicious activity
router.get('/suspicious-activity', protect, checkSuspiciousActivity);

module.exports = router;
