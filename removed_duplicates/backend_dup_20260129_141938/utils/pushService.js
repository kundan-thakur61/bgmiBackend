/**
 * Push Notification Service
 * Handles sending web push notifications to subscribed users
 * 
 * SETUP REQUIRED:
 * 1. Generate VAPID keys: npx web-push generate-vapid-keys
 * 2. Add to .env:
 *    VAPID_PUBLIC_KEY=your_public_key_here
 *    VAPID_PRIVATE_KEY=your_private_key_here
 *    VAPID_EMAIL=mailto:your-email@example.com
 */

const webpush = require('web-push');

// Initialize VAPID keys if they exist
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@battlezone.com';

let isConfigured = false;

if (vapidPublicKey && vapidPrivateKey) {
    try {
        webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
        isConfigured = true;
        console.log('✅ Web Push notifications configured');
    } catch (err) {
        console.error('❌ Failed to configure Web Push:', err.message);
    }
} else {
    console.warn('⚠️ VAPID keys not configured. Push notifications disabled.');
}

/**
 * Send push notification to a single user
 * @param {Object} subscription - Push subscription object
 * @param {Object} payload - Notification payload
 * @returns {Promise<boolean>} - Success status
 */
const sendPush = async (subscription, payload) => {
    if (!isConfigured) {
        console.warn('Push notifications not configured');
        return false;
    }

    if (!subscription?.endpoint) {
        console.warn('Invalid push subscription');
        return false;
    }

    try {
        const notificationPayload = JSON.stringify({
            title: payload.title || 'BattleZone',
            body: payload.body || payload.message || '',
            icon: payload.icon || '/icons/icon-192x192.png',
            badge: payload.badge || '/icons/badge-72x72.png',
            image: payload.image,
            data: {
                url: payload.url || payload.actionUrl || '/',
                type: payload.type,
                ...payload.data
            },
            actions: payload.actions || [
                { action: 'open', title: 'View' },
                { action: 'dismiss', title: 'Dismiss' }
            ],
            tag: payload.tag || 'battlezone-notification',
            renotify: payload.renotify || false,
            requireInteraction: payload.requireInteraction || false,
            silent: payload.silent || false,
            timestamp: Date.now()
        });

        await webpush.sendNotification(subscription, notificationPayload);
        return true;
    } catch (err) {
        // Handle expired subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
            console.log('Push subscription expired, should be removed');
            return { expired: true };
        }
        console.error('Push notification failed:', err.message);
        return false;
    }
};

/**
 * Send push notifications to multiple users
 * @param {Array} subscriptions - Array of { userId, subscription } objects
 * @param {Object} payload - Notification payload
 * @returns {Promise<Object>} - Results summary
 */
const sendBulkPush = async (subscriptions, payload) => {
    if (!isConfigured || !Array.isArray(subscriptions)) {
        return { success: 0, failed: 0, expired: [] };
    }

    const results = {
        success: 0,
        failed: 0,
        expired: []
    };

    const promises = subscriptions.map(async ({ userId, subscription }) => {
        const result = await sendPush(subscription, payload);
        if (result === true) {
            results.success++;
        } else if (result?.expired) {
            results.expired.push(userId);
        } else {
            results.failed++;
        }
    });

    await Promise.allSettled(promises);
    return results;
};

/**
 * Pre-built notification templates
 */
const templates = {
    matchReminder: (match) => ({
        title: '⏰ Match Starting Soon!',
        body: `${match.title} is starting in 15 minutes. Get ready!`,
        icon: '/icons/match-icon.png',
        url: `/matches/${match._id}`,
        type: 'match_reminder',
        tag: `match-reminder-${match._id}`,
        requireInteraction: true
    }),

    roomReleased: (match) => ({
        title: '🔓 Room Details Available!',
        body: `Room credentials for ${match.title} are now available. Join now!`,
        icon: '/icons/room-icon.png',
        url: `/matches/${match._id}`,
        type: 'room_released',
        tag: `room-${match._id}`,
        requireInteraction: true
    }),

    matchCompleted: (match, result) => ({
        title: result.position === 1 ? '🏆 Winner Winner Chicken Dinner!' : '🎮 Match Completed',
        body: result.position === 1
            ? `Congratulations! You won ₹${result.prize} in ${match.title}!`
            : `You finished #${result.position} with ${result.kills} kills in ${match.title}`,
        icon: '/icons/trophy-icon.png',
        url: `/matches/${match._id}`,
        type: 'match_completed',
        tag: `match-result-${match._id}`
    }),

    withdrawalApproved: (amount) => ({
        title: '💰 Withdrawal Approved!',
        body: `Your withdrawal of ₹${amount} has been approved and is being processed.`,
        icon: '/icons/wallet-icon.png',
        url: '/wallet',
        type: 'withdrawal_approved',
        tag: 'withdrawal-approved'
    }),

    withdrawalRejected: (amount, reason) => ({
        title: '❌ Withdrawal Rejected',
        body: `Your withdrawal of ₹${amount} was rejected. ${reason || 'Please check details.'}`,
        icon: '/icons/wallet-icon.png',
        url: '/wallet',
        type: 'withdrawal_rejected',
        tag: 'withdrawal-rejected'
    }),

    kycApproved: () => ({
        title: '✅ KYC Verified!',
        body: 'Your KYC verification is complete. You can now withdraw funds!',
        icon: '/icons/verified-icon.png',
        url: '/profile',
        type: 'kyc_approved',
        tag: 'kyc-approved'
    }),

    kycRejected: (reason) => ({
        title: '❌ KYC Rejected',
        body: `Your KYC was rejected. ${reason || 'Please resubmit with valid documents.'}`,
        icon: '/icons/kyc-icon.png',
        url: '/kyc',
        type: 'kyc_rejected',
        tag: 'kyc-rejected'
    }),

    teamInvite: (teamName) => ({
        title: '👥 Team Invite!',
        body: `You've been invited to join team "${teamName}"`,
        icon: '/icons/team-icon.png',
        url: '/teams',
        type: 'team_invite',
        tag: 'team-invite'
    }),

    achievementUnlocked: (achievement) => ({
        title: '🏆 Achievement Unlocked!',
        body: `${achievement.name}: ${achievement.description}`,
        icon: '/icons/achievement-icon.png',
        url: '/achievements',
        type: 'achievement',
        tag: `achievement-${achievement.code}`
    }),

    disputeResolved: (resolution) => ({
        title: resolution === 'accepted' ? '✅ Dispute Accepted' : '📋 Dispute Resolved',
        body: `Your dispute has been ${resolution}. Check the details.`,
        icon: '/icons/dispute-icon.png',
        url: '/disputes',
        type: 'dispute_resolved',
        tag: 'dispute-resolved'
    })
};

/**
 * Get VAPID public key for client-side subscription
 */
const getPublicKey = () => vapidPublicKey;

/**
 * Check if push notifications are enabled
 */
const isEnabled = () => isConfigured;

module.exports = {
    sendPush,
    sendBulkPush,
    templates,
    getPublicKey,
    isEnabled
};
