const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined', 'blocked'],
        default: 'pending'
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: Date,
    lastInteraction: Date,
    metadata: {
        requesterSeen: { type: Boolean, default: false },
        recipientSeen: { type: Boolean, default: false },
        matchesTogether: { type: Number, default: 0 },
        lastPlayedTogether: Date
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate friendships
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ status: 1 });
friendshipSchema.index({ requester: 1, status: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });

// Method to accept friend request
friendshipSchema.methods.accept = function () {
    this.status = 'accepted';
    this.respondedAt = new Date();
    this.lastInteraction = new Date();
};

// Method to decline friend request
friendshipSchema.methods.decline = function () {
    this.status = 'declined';
    this.respondedAt = new Date();
};

// Method to block user
friendshipSchema.methods.block = function () {
    this.status = 'blocked';
    this.respondedAt = new Date();
};

// Check if users are friends
friendshipSchema.statics.areFriends = async function (userId1, userId2) {
    const friendship = await this.findOne({
        $or: [
            { requester: userId1, recipient: userId2, status: 'accepted' },
            { requester: userId2, recipient: userId1, status: 'accepted' }
        ]
    });
    return !!friendship;
};

// Get all friends for a user
friendshipSchema.statics.getFriends = async function (userId) {
    const friendships = await this.find({
        $or: [
            { requester: userId, status: 'accepted' },
            { recipient: userId, status: 'accepted' }
        ]
    }).populate('requester recipient', 'username avatar gameId isOnline lastSeen');

    return friendships.map(friendship => {
        const friend = friendship.requester._id.toString() === userId.toString()
            ? friendship.recipient
            : friendship.requester;

        return {
            ...friend.toObject(),
            friendshipId: friendship._id,
            matchesTogether: friendship.metadata.matchesTogether,
            lastPlayedTogether: friendship.metadata.lastPlayedTogether
        };
    });
};

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = Friendship;
