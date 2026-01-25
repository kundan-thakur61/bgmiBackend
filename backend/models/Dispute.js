const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
        index: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Dispute details
    reason: {
        type: String,
        required: true,
        enum: [
            'wrong_result',
            'missing_kills',
            'wrong_position',
            'prize_not_received',
            'cheating',
            'bug_issue',
            'other'
        ]
    },
    description: {
        type: String,
        required: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    // Evidence
    evidence: [{
        type: {
            type: String,
            enum: ['screenshot', 'video', 'link'],
            required: true
        },
        url: {
            type: String,
            required: true
        },
        description: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'under_review', 'resolved', 'rejected', 'closed'],
        default: 'pending',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    // Resolution
    resolution: {
        type: String,
        enum: ['accepted', 'partially_accepted', 'rejected', 'duplicate', 'insufficient_evidence'],
    },
    resolutionNotes: String,
    resolutionAction: String, // Description of what was done
    // Admin handling
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: Date,
    // Admin notes (internal)
    adminNotes: [{
        note: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Communication
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: String,
        isAdmin: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes
disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ match: 1, submittedBy: 1 });

// Check if user already has a dispute for this match
disputeSchema.statics.hasExistingDispute = async function (matchId, userId) {
    const existing = await this.findOne({
        match: matchId,
        submittedBy: userId,
        status: { $in: ['pending', 'under_review'] }
    });
    return !!existing;
};

module.exports = mongoose.model('Dispute', disputeSchema);
