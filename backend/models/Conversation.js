const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    // Participants in the conversation (for DMs, exactly 2 users)
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],

    // Conversation type
    type: {
        type: String,
        enum: ['dm', 'group'],
        default: 'dm'
    },

    // Group chat specific fields
    groupName: {
        type: String,
        trim: true,
        maxlength: [50, 'Group name cannot exceed 50 characters']
    },
    groupAvatar: {
        url: String,
        publicId: String
    },
    groupAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Last message for preview
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },

    // Unread message count per participant
    unreadCount: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        count: {
            type: Number,
            default: 0
        }
    }],

    // Typing status (managed via Socket.io, stored for reference)
    typingUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Conversation status
    isActive: {
        type: Boolean,
        default: true
    },

    // Blocked users (for DMs)
    blockedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ 'unreadCount.user': 1 });

// Find or create DM conversation between two users
conversationSchema.statics.findOrCreateDM = async function (user1Id, user2Id) {
    // Check if conversation already exists
    let conversation = await this.findOne({
        type: 'dm',
        participants: { $all: [user1Id, user2Id], $size: 2 }
    });

    if (!conversation) {
        conversation = await this.create({
            type: 'dm',
            participants: [user1Id, user2Id],
            unreadCount: [
                { user: user1Id, count: 0 },
                { user: user2Id, count: 0 }
            ]
        });
    }

    return conversation;
};

// Get user's conversations ordered by last message
conversationSchema.statics.getUserConversations = async function (userId, limit = 20, skip = 0) {
    return this.find({
        participants: userId,
        isActive: true
    })
        .populate('participants', 'name avatar')
        .populate({
            path: 'lastMessage',
            select: 'content sender createdAt messageType isDeleted',
            populate: {
                path: 'sender',
                select: 'name'
            }
        })
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit);
};

// Increment unread count for a user
conversationSchema.methods.incrementUnread = function (userId) {
    const userUnread = this.unreadCount.find(
        u => u.user.toString() === userId.toString()
    );

    if (userUnread) {
        userUnread.count += 1;
    } else {
        this.unreadCount.push({ user: userId, count: 1 });
    }

    return this;
};

// Reset unread count for a user
conversationSchema.methods.resetUnread = function (userId) {
    const userUnread = this.unreadCount.find(
        u => u.user.toString() === userId.toString()
    );

    if (userUnread) {
        userUnread.count = 0;
    }

    return this;
};

// Get unread count for a specific user
conversationSchema.methods.getUnreadCount = function (userId) {
    const userUnread = this.unreadCount.find(
        u => u.user.toString() === userId.toString()
    );

    return userUnread ? userUnread.count : 0;
};

// Check if user is a participant
conversationSchema.methods.isParticipant = function (userId) {
    return this.participants.some(
        p => p.toString() === userId.toString() || (p._id && p._id.toString() === userId.toString())
    );
};

// Get the other participant in a DM
conversationSchema.methods.getOtherParticipant = function (userId) {
    return this.participants.find(
        p => {
            const participantId = p._id ? p._id.toString() : p.toString();
            return participantId !== userId.toString();
        }
    );
};

// Check if conversation is blocked
conversationSchema.methods.isBlockedBy = function (userId) {
    return this.blockedBy.some(
        b => b.toString() === userId.toString()
    );
};

// Virtual for total message count (would need to be computed)
conversationSchema.virtual('totalUnread').get(function () {
    return this.unreadCount.reduce((total, u) => total + u.count, 0);
});

conversationSchema.set('toJSON', { virtuals: true });
conversationSchema.set('toObject', { virtuals: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
