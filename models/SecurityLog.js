const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventType: {
        type: String,
        enum: [
            'login_success',
            'login_failed',
            'logout',
            'password_change',
            'email_change',
            'phone_change',
            '2fa_enabled',
            '2fa_disabled',
            'withdrawal_request',
            'kyc_submission',
            'suspicious_activity',
            'account_locked',
            'account_unlocked'
        ],
        required: true
    },
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'info'
    },
    description: String,
    ipAddress: String,
    userAgent: String,
    location: {
        country: String,
        region: String,
        city: String
    },
    deviceInfo: {
        deviceId: String,
        deviceType: String,
        os: String,
        browser: String
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    requiresAction: {
        type: Boolean,
        default: false
    },
    resolved: {
        type: Boolean,
        default: false
    },
    resolvedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
securityLogSchema.index({ user: 1, createdAt: -1 });
securityLogSchema.index({ eventType: 1 });
securityLogSchema.index({ severity: 1, resolved: 1 });
securityLogSchema.index({ ipAddress: 1 });
securityLogSchema.index({ requiresAction: 1, resolved: 1 });

// Static method to detect suspicious activity
securityLogSchema.statics.detectSuspiciousActivity = async function (userId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Multiple failed login attempts
    const failedLogins = await this.countDocuments({
        user: userId,
        eventType: 'login_failed',
        createdAt: { $gte: oneHourAgo }
    });

    if (failedLogins >= 5) {
        return {
            suspicious: true,
            reason: 'multiple_failed_logins',
            count: failedLogins
        };
    }

    // Login from multiple IPs
    const recentLogins = await this.find({
        user: userId,
        eventType: 'login_success',
        createdAt: { $gte: oneHourAgo }
    }).select('ipAddress');

    const uniqueIPs = new Set(recentLogins.map(log => log.ipAddress));
    if (uniqueIPs.size >= 3) {
        return {
            suspicious: true,
            reason: 'multiple_ip_addresses',
            count: uniqueIPs.size
        };
    }

    return { suspicious: false };
};

// Mark as resolved
securityLogSchema.methods.resolve = function (resolvedBy) {
    this.resolved = true;
    this.resolvedAt = new Date();
    this.resolvedBy = resolvedBy;
};

const SecurityLog = mongoose.model('SecurityLog', securityLogSchema);

module.exports = SecurityLog;
