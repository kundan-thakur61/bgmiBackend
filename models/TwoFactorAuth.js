const mongoose = require('mongoose');

const twoFactorAuthSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    isEnabled: {
        type: Boolean,
        default: false
    },
    secret: {
        type: String,
        required: true
    },
    backupCodes: [{
        code: String,
        used: { type: Boolean, default: false },
        usedAt: Date
    }],
    trustedDevices: [{
        deviceId: String,
        deviceName: String,
        deviceType: String, // 'mobile', 'desktop', 'tablet'
        ipAddress: String,
        userAgent: String,
        trustedAt: {
            type: Date,
            default: Date.now
        },
        lastUsed: Date,
        isActive: { type: Boolean, default: true }
    }],
    verificationHistory: [{
        method: { type: String, enum: ['app', 'backup_code'] },
        success: Boolean,
        ipAddress: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    enabledAt: Date,
    lastVerified: Date
}, {
    timestamps: true
});

// Add backup code
twoFactorAuthSchema.methods.generateBackupCodes = function (count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
        this.backupCodes.push({ code, used: false });
    }
    return codes;
};

// Use backup code
twoFactorAuthSchema.methods.useBackupCode = function (code) {
    const backupCode = this.backupCodes.find(
        bc => bc.code === code.toUpperCase() && !bc.used
    );

    if (backupCode) {
        backupCode.used = true;
        backupCode.usedAt = new Date();
        this.lastVerified = new Date();
        return true;
    }

    return false;
};

// Add trusted device
twoFactorAuthSchema.methods.addTrustedDevice = function (deviceInfo) {
    // Check if device already exists
    const existingDevice = this.trustedDevices.find(
        d => d.deviceId === deviceInfo.deviceId
    );

    if (existingDevice) {
        existingDevice.lastUsed = new Date();
        existingDevice.isActive = true;
    } else {
        this.trustedDevices.push({
            ...deviceInfo,
            trustedAt: new Date(),
            lastUsed: new Date()
        });
    }
};

// Check if device is trusted
twoFactorAuthSchema.methods.isDeviceTrusted = function (deviceId) {
    const device = this.trustedDevices.find(
        d => d.deviceId === deviceId && d.isActive
    );

    if (device) {
        device.lastUsed = new Date();
        return true;
    }

    return false;
};

// Remove trusted device
twoFactorAuthSchema.methods.removeTrustedDevice = function (deviceId) {
    const device = this.trustedDevices.find(d => d.deviceId === deviceId);
    if (device) {
        device.isActive = false;
        return true;
    }
    return false;
};

// Log verification attempt
twoFactorAuthSchema.methods.logVerification = function (method, success, ipAddress) {
    this.verificationHistory.push({
        method,
        success,
        ipAddress,
        timestamp: new Date()
    });

    // Keep only last 50 records
    if (this.verificationHistory.length > 50) {
        this.verificationHistory = this.verificationHistory.slice(-50);
    }

    if (success) {
        this.lastVerified = new Date();
    }
};

// Indexes (user already indexed via unique: true in schema)
twoFactorAuthSchema.index({ isEnabled: 1 });

const TwoFactorAuth = mongoose.model('TwoFactorAuth', twoFactorAuthSchema);

module.exports = TwoFactorAuth;
