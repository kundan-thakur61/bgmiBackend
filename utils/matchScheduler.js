const cron = require('node-cron');
const Match = require('../models/Match');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

/**
 * Auto-refund expired challenge matches
 * Runs periodically to check for challenge matches that have expired without opponents
 * and automatically refunds the creator's wallet
 */

const processExpiredMatches = async () => {
    try {
        console.log('🔍 Checking for expired challenge matches...');

        // Find expired challenge matches that need auto-refund
        const now = new Date();
        const expiredMatches = await Match.find({
            isChallenge: true,
            status: { $in: ['upcoming', 'registration_open', 'room_revealed'] },
            scheduledAt: { $lt: now }, // Scheduled time has passed
            filledSlots: { $lte: 1 }, // Only creator (no opponent joined)
            $or: [
                { cancelledAt: { $exists: false } },
                { cancelledAt: null }
            ]
        }).populate('createdBy', 'name email walletBalance');

        if (expiredMatches.length === 0) {
            console.log('✅ No expired matches found');
            return;
        }

        console.log(`📋 Found ${expiredMatches.length} expired match(es) to process`);

        // Process each expired match
        for (const match of expiredMatches) {
            try {
                await processMatchRefund(match);
            } catch (error) {
                console.error(`❌ Error processing match ${match._id}:`, error.message);
                // Continue processing other matches even if one fails
            }
        }

        console.log('✅ Expired matches processing complete');
    } catch (error) {
        console.error('❌ Error in processExpiredMatches:', error);
    }
};

/**
 * Process refund for a single expired match
 */
const processMatchRefund = async (match) => {
    console.log(`💰 Processing refund for match: ${match.title} (${match._id})`);

    const creatorId = match.createdBy._id || match.createdBy;

    // Calculate refund amounts
    const creationFeeRefund = match.creationFee || 0;
    const prizePoolRefund = match.prizePool || 0;
    const totalRefund = creationFeeRefund + prizePoolRefund;

    if (totalRefund <= 0) {
        console.log(`⚠️ No refund needed for match ${match._id} (total: ₹0)`);
        match.status = 'cancelled';
        match.cancelledAt = new Date();
        match.cancellationReason = 'Auto-cancelled: Expired without opponent';
        await match.save();
        return;
    }

    // Refund creation fee
    if (creationFeeRefund > 0) {
        await Transaction.createTransaction({
            user: creatorId,
            type: 'credit',
            category: 'match_auto_refund',
            amount: creationFeeRefund,
            description: `Auto-refund creation fee for expired challenge: ${match.title}`,
            reference: { type: 'match', id: match._id },
            status: 'completed'
        });
        console.log(`  ✓ Refunded creation fee: ₹${creationFeeRefund}`);
    }

    // Refund prize pool
    if (prizePoolRefund > 0) {
        await Transaction.createTransaction({
            user: creatorId,
            type: 'credit',
            category: 'match_auto_refund',
            amount: prizePoolRefund,
            description: `Auto-refund prize pool for expired challenge: ${match.title}`,
            reference: { type: 'match', id: match._id },
            status: 'completed'
        });
        console.log(`  ✓ Refunded prize pool: ₹${prizePoolRefund}`);
    }

    // Update match status
    match.status = 'cancelled';
    match.cancelledAt = new Date();
    match.cancellationReason = 'Auto-cancelled: Expired without opponent joining';
    await match.save();

    // Get updated user balance
    const updatedUser = await User.findById(creatorId);

    // Send notification to creator
    await Notification.createNotification(
        creatorId,
        'match',
        'Match Auto-Cancelled 🔄',
        `Your challenge "${match.title}" expired without opponents. ₹${totalRefund} has been refunded to your wallet.`,
        {
            matchId: match._id,
            refundAmount: totalRefund,
            newBalance: updatedUser?.walletBalance || 0
        }
    );

    console.log(`✅ Match ${match._id} processed successfully. Total refund: ₹${totalRefund}`);
};

/**
 * Initialize the scheduler
 * Runs every 5 minutes (cron: * /5 * * * *)
 */
const initializeMatchScheduler = () => {
    console.log('⏰ Initializing match scheduler...');

    // Run every 5 minutes
    const task = cron.schedule('*/5 * * * *', async () => {
        await processExpiredMatches();
    }, {
        scheduled: true,
        timezone: 'UTC'
    });

    console.log('✅ Match scheduler started (runs every 5 minutes)');

    // Also run immediately on startup (optional - helps catch any matches that expired while server was down)
    setTimeout(() => {
        processExpiredMatches();
    }, 10000); // Wait 10 seconds after startup to ensure DB is ready

    return task;
};

/**
 * Stop the scheduler (for graceful shutdown)
 */
const stopMatchScheduler = (task) => {
    if (task) {
        task.stop();
        console.log('⏹️ Match scheduler stopped');
    }
};

module.exports = {
    initializeMatchScheduler,
    stopMatchScheduler,
    processExpiredMatches // Export for testing
};
