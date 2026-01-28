const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true,
        maxlength: [30, 'Team name cannot exceed 30 characters']
    },
    tag: {
        type: String,
        required: [true, 'Team tag is required'],
        uppercase: true,
        minlength: [2, 'Tag must be at least 2 characters'],
        maxlength: [5, 'Tag cannot exceed 5 characters']
    },
    description: {
        type: String,
        maxlength: [200, 'Description cannot exceed 200 characters']
    },
    logo: {
        url: String,
        publicId: String
    },
    // Team composition
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['captain', 'co-captain', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Invitations
    invites: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'expired'],
            default: 'pending'
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    }],
    // Settings
    maxMembers: {
        type: Number,
        default: 4,
        min: 2,
        max: 10
    },
    gameType: {
        type: String,
        enum: ['pubg_mobile', 'free_fire', 'all'],
        default: 'all'
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    // Stats
    stats: {
        matchesPlayed: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 },
        totalKills: { type: Number, default: 0 },
        totalEarnings: { type: Number, default: 0 }
    },
    // Status
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
teamSchema.index({ captain: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ 'invites.user': 1, 'invites.status': 1 });
teamSchema.index({ name: 'text', tag: 'text' });

// Virtual for member count
teamSchema.virtual('memberCount').get(function () {
    return this.members.length;
});

// Check if team is full
teamSchema.methods.isFull = function () {
    return this.members.length >= this.maxMembers;
};

// Check if user is member
teamSchema.methods.isMember = function (userId) {
    return this.members.some(m => m.user.toString() === userId.toString());
};

// Check if user is captain
teamSchema.methods.isCaptain = function (userId) {
    return this.captain.toString() === userId.toString();
};

// Check if user has pending invite
teamSchema.methods.hasPendingInvite = function (userId) {
    return this.invites.some(
        i => i.user.toString() === userId.toString() && i.status === 'pending'
    );
};

// Add member
teamSchema.methods.addMember = function (userId, role = 'member') {
    if (this.isFull()) {
        throw new Error('Team is full');
    }
    if (this.isMember(userId)) {
        throw new Error('User is already a member');
    }
    this.members.push({ user: userId, role });
};

// Remove member
teamSchema.methods.removeMember = function (userId) {
    const index = this.members.findIndex(m => m.user.toString() === userId.toString());
    if (index === -1) {
        throw new Error('User is not a member');
    }
    if (this.isCaptain(userId)) {
        throw new Error('Captain cannot be removed. Transfer captaincy first or disband team.');
    }
    this.members.splice(index, 1);
};

// JSON transform
teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Team', teamSchema);
