const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    // Room identification
    roomCode: {
        type: String,
        required: true,
        unique: true,
        length: 6,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Room title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },

    // Game configuration
    gameType: {
        type: String,
        required: [true, 'Game type is required'],
        enum: ['pubg_mobile', 'free_fire'],
        index: true
    },
    mode: {
        type: String,
        required: true,
        enum: ['solo', 'duo', 'squad'],
        index: true
    },
    map: {
        type: String,
        required: true,
        enum: [
            'erangel', 'miramar', 'sanhok', 'vikendi', 'livik', 'karakin',
            'bermuda', 'purgatory', 'kalahari', 'alpine', 'nextera', 'other'
        ]
    },

    // Capacity settings
    maxSlots: {
        type: Number,
        required: [true, 'Maximum slots is required'],
        min: [2, 'Minimum 2 slots required'],
        max: [100, 'Maximum 100 slots allowed']
    },

    // Host and participants
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        slotNumber: {
            type: Number,
            required: true
        },
        teamNumber: Number, // For duo/squad modes
        inGameName: String,
        inGameId: String,
        joinedAt: {
            type: Date,
            default: Date.now
        },
        isReady: {
            type: Boolean,
            default: false
        }
    }],

    // Room settings
    password: {
        type: String,
        select: false
    },
    isPasswordProtected: {
        type: Boolean,
        default: false
    },
    minLevelRequired: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'none'],
        default: 'none'
    },
    region: {
        type: String,
        enum: ['asia', 'europe', 'north_america', 'south_america', 'oceania', 'africa', 'global'],
        default: 'global'
    },

    // Room status
    status: {
        type: String,
        enum: ['waiting', 'filling', 'ready', 'starting', 'started', 'closed'],
        default: 'waiting',
        index: true
    },

    // Match linking (when room starts)
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    },

    // Timing
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    startedAt: Date,
    closedAt: Date,

    // Auto-close timer (in seconds, default 2 hours)
    autoCloseTimer: {
        type: Number,
        default: 7200 // 2 hours
    },

    // Spectators
    spectators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Settings
    allowSpectators: {
        type: Boolean,
        default: true
    },
    maxSpectators: {
        type: Number,
        default: 10
    }
}, {
    timestamps: true
});

// Indexes for performance
roomSchema.index({ status: 1, createdAt: -1 });
roomSchema.index({ gameType: 1, mode: 1, status: 1 });
roomSchema.index({ host: 1, status: 1 });
roomSchema.index({ 'participants.user': 1 });

// Virtual for filled slots count
roomSchema.virtual('filledSlots').get(function () {
    return this.participants.length;
});

// Virtual for available slots
roomSchema.virtual('availableSlots').get(function () {
    return this.maxSlots - this.participants.length;
});

// Virtual for spectator count
roomSchema.virtual('spectatorCount').get(function () {
    return this.spectators.length;
});

// Generate unique 6-digit room code
roomSchema.statics.generateRoomCode = async function () {
    let code;
    let exists = true;

    while (exists) {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        const room = await this.findOne({ roomCode: code, status: { $ne: 'closed' } });
        exists = !!room;
    }

    return code;
};

// Check if room is joinable
roomSchema.methods.isJoinable = function () {
    if (this.status !== 'waiting' && this.status !== 'filling') {
        return { joinable: false, reason: 'Room is not accepting new players' };
    }
    if (this.participants.length >= this.maxSlots) {
        return { joinable: false, reason: 'Room is full' };
    }
    return { joinable: true };
};

// Check if user is participant
roomSchema.methods.isParticipant = function (userId) {
    return this.participants.some(p => {
        const participantId = p.user._id ? p.user._id : p.user;
        return participantId.toString() === userId.toString();
    });
};

// Check if user is host
roomSchema.methods.isHost = function (userId) {
    const hostId = this.host._id ? this.host._id : this.host;
    return hostId.toString() === userId.toString();
};

// Get participant by user ID
roomSchema.methods.getParticipant = function (userId) {
    return this.participants.find(p => {
        const participantId = p.user._id ? p.user._id : p.user;
        return participantId.toString() === userId.toString();
    });
};

// Add participant to room
roomSchema.methods.addParticipant = function (userId, inGameName, inGameId) {
    if (this.isParticipant(userId)) {
        throw new Error('User has already joined this room');
    }

    const { joinable, reason } = this.isJoinable();
    if (!joinable) {
        throw new Error(reason);
    }

    const slotNumber = this.participants.length + 1;

    // Calculate team number for duo/squad modes
    let teamNumber;
    if (this.mode === 'duo') {
        teamNumber = Math.ceil(slotNumber / 2);
    } else if (this.mode === 'squad') {
        teamNumber = Math.ceil(slotNumber / 4);
    }

    this.participants.push({
        user: userId,
        slotNumber,
        teamNumber,
        inGameName,
        inGameId,
        isReady: false
    });

    // Update status
    if (this.status === 'waiting' && this.participants.length > 0) {
        this.status = 'filling';
    }

    return { slotNumber, teamNumber };
};

// Remove participant from room
roomSchema.methods.removeParticipant = function (userId) {
    const index = this.participants.findIndex(p => {
        const participantId = p.user._id ? p.user._id : p.user;
        return participantId.toString() === userId.toString();
    });

    if (index === -1) {
        throw new Error('User is not in this room');
    }

    this.participants.splice(index, 1);

    // Reassign slot numbers and team numbers
    this.participants.forEach((p, idx) => {
        p.slotNumber = idx + 1;
        if (this.mode === 'duo') {
            p.teamNumber = Math.ceil(p.slotNumber / 2);
        } else if (this.mode === 'squad') {
            p.teamNumber = Math.ceil(p.slotNumber / 4);
        }
    });

    // Update status if room becomes empty
    if (this.participants.length === 0) {
        this.status = 'waiting';
    }
};

// Add spectator
roomSchema.methods.addSpectator = function (userId) {
    if (!this.allowSpectators) {
        throw new Error('Spectators are not allowed in this room');
    }

    if (this.spectators.length >= this.maxSpectators) {
        throw new Error('Maximum spectator limit reached');
    }

    const alreadySpectating = this.spectators.some(s => {
        const spectatorId = s.user._id ? s.user._id : s.user;
        return spectatorId.toString() === userId.toString();
    });

    if (alreadySpectating) {
        throw new Error('User is already spectating');
    }

    this.spectators.push({ user: userId });
};

// Remove spectator
roomSchema.methods.removeSpectator = function (userId) {
    const index = this.spectators.findIndex(s => {
        const spectatorId = s.user._id ? s.user._id : s.user;
        return spectatorId.toString() === userId.toString();
    });

    if (index === -1) {
        throw new Error('User is not spectating');
    }

    this.spectators.splice(index, 1);
};

// Check if all participants are ready
roomSchema.methods.allParticipantsReady = function () {
    return this.participants.length > 0 &&
        this.participants.every(p => p.isReady);
};

// Pre-save middleware to validate mode-specific constraints
roomSchema.pre('save', function (next) {
    // Set default max slots based on mode if not specified
    if (this.isNew && !this.maxSlots) {
        if (this.mode === 'solo') {
            this.maxSlots = 32;
        } else if (this.mode === 'duo') {
            this.maxSlots = 24; // 12 teams
        } else if (this.mode === 'squad') {
            this.maxSlots = 24; // 6 teams
        }
    }

    next();
});

// JSON transform to include virtuals
roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Room', roomSchema);
