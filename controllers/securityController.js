const { TwoFactorAuth, SecurityLog, User } = require('../models');
const { BadRequestError, NotFoundError } = require('../middleware/errorHandler');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// @desc    Setup 2FA
// @route   POST /api/security/2fa/setup
// @access  Private
exports.setup2FA = async (req, res, next) => {
    try {
        // Check if 2FA is already enabled
        let twoFA = await TwoFactorAuth.findOne({ user: req.user.id });

        if (twoFA && twoFA.isEnabled) {
            throw new BadRequestError('2FA is already enabled');
        }

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `BattleZone (${req.user.username})`,
            issuer: 'BattleZone'
        });

        if (!twoFA) {
            twoFA = await TwoFactorAuth.create({
                user: req.user.id,
                secret: secret.base32,
                isEnabled: false
            });
        } else {
            twoFA.secret = secret.base32;
            await twoFA.save();
        }

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.json({
            success: true,
            data: {
                secret: secret.base32,
                qrCode: qrCodeUrl,
                manualEntry: secret.base32
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Enable 2FA
// @route   POST /api/security/2fa/enable
// @access  Private
exports.enable2FA = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            throw new BadRequestError('Verification token is required');
        }

        const twoFA = await TwoFactorAuth.findOne({ user: req.user.id });

        if (!twoFA) {
            throw new NotFoundError('2FA setup not found. Please setup 2FA first');
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: twoFA.secret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            throw new BadRequestError('Invalid verification code');
        }

        // Enable 2FA
        twoFA.isEnabled = true;
        twoFA.enabledAt = new Date();

        // Generate backup codes
        const backupCodes = twoFA.generateBackupCodes();

        await twoFA.save();

        // Log security event
        await SecurityLog.create({
            user: req.user.id,
            eventType: '2fa_enabled',
            severity: 'info',
            description: 'User enabled 2FA',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({
            success: true,
            message: '2FA enabled successfully',
            data: {
                backupCodes
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify 2FA token
// @route   POST /api/security/2fa/verify
// @access  Private
exports.verify2FA = async (req, res, next) => {
    try {
        const { token, type = 'app' } = req.body;

        if (!token) {
            throw new BadRequestError('Token is required');
        }

        const twoFA = await TwoFactorAuth.findOne({ user: req.user.id });

        if (!twoFA || !twoFA.isEnabled) {
            throw new NotFoundError('2FA is not enabled');
        }

        let verified = false;

        if (type === 'app') {
            verified = speakeasy.totp.verify({
                secret: twoFA.secret,
                encoding: 'base32',
                token: token,
                window: 2
            });
        } else if (type === 'backup') {
            verified = twoFA.useBackupCode(token);
            if (verified) {
                await twoFA.save();
            }
        }

        // Log verification attempt
        twoFA.logVerification(type, verified, req.ip);
        await twoFA.save();

        if (!verified) {
            throw new BadRequestError('Invalid verification code');
        }

        res.json({
            success: true,
            message: 'Verification successful'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Disable 2FA
// @route   POST /api/security/2fa/disable
// @access  Private
exports.disable2FA = async (req, res, next) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            throw new BadRequestError('Token and password are required');
        }

        // Verify password
        const user = await User.findById(req.user.id).select('+password');
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            throw new BadRequestError('Invalid password');
        }

        const twoFA = await TwoFactorAuth.findOne({ user: req.user.id });

        if (!twoFA || !twoFA.isEnabled) {
            throw new NotFoundError('2FA is not enabled');
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: twoFA.secret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            throw new BadRequestError('Invalid verification code');
        }

        // Disable 2FA
        twoFA.isEnabled = false;
        await twoFA.save();

        // Log security event
        await SecurityLog.create({
            user: req.user.id,
            eventType: '2fa_disabled',
            severity: 'warning',
            description: 'User disabled 2FA',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({
            success: true,
            message: '2FA disabled successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get 2FA status
// @route   GET /api/security/2fa/status
// @access  Private
exports.get2FAStatus = async (req, res, next) => {
    try {
        const twoFA = await TwoFactorAuth.findOne({ user: req.user.id });

        res.json({
            success: true,
            data: {
                isEnabled: twoFA ? twoFA.isEnabled : false,
                enabledAt: twoFA?.enabledAt,
                backupCodesRemaining: twoFA?.backupCodes.filter(bc => !bc.used).length || 0,
                trustedDevices: twoFA?.trustedDevices.filter(d => d.isActive).length || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get security logs
// @route   GET /api/security/logs
// @access  Private
exports.getSecurityLogs = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, eventType, severity } = req.query;

        const query = { user: req.user.id };

        if (eventType) query.eventType = eventType;
        if (severity) query.severity = severity;

        const logs = await SecurityLog.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await SecurityLog.countDocuments(query);

        res.json({
            success: true,
            count: logs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: logs
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get trusted devices
// @route   GET /api/security/devices
// @access  Private
exports.getTrustedDevices = async (req, res, next) => {
    try {
        const twoFA = await TwoFactorAuth.findOne({ user: req.user.id });

        const devices = twoFA?.trustedDevices.filter(d => d.isActive) || [];

        res.json({
            success: true,
            count: devices.length,
            data: devices
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove trusted device
// @route   DELETE /api/security/devices/:deviceId
// @access  Private
exports.removeTrustedDevice = async (req, res, next) => {
    try {
        const { deviceId } = req.params;

        const twoFA = await TwoFactorAuth.findOne({ user: req.user.id });

        if (!twoFA) {
            throw new NotFoundError('2FA not setup');
        }

        const removed = twoFA.removeTrustedDevice(deviceId);

        if (!removed) {
            throw new NotFoundError('Device not found');
        }

        await twoFA.save();

        // Log security event
        await SecurityLog.create({
            user: req.user.id,
            eventType: 'suspicious_activity',
            severity: 'info',
            description: 'User removed a trusted device',
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: { deviceId }
        });

        res.json({
            success: true,
            message: 'Device removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Check for suspicious activity
// @route   GET /api/security/suspicious-activity
// @access  Private
exports.checkSuspiciousActivity = async (req, res, next) => {
    try {
        const activity = await SecurityLog.detectSuspiciousActivity(req.user.id);

        if (activity.suspicious) {
            // Create a security log
            await SecurityLog.create({
                user: req.user.id,
                eventType: 'suspicious_activity',
                severity: 'warning',
                description: `Suspicious activity detected: ${activity.reason}`,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                requiresAction: true,
                metadata: { reason: activity.reason, count: activity.count }
            });
        }

        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        next(error);
    }
};

module.exports = exports;
