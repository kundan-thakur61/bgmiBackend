const Room = require('../models/Room');
const User = require('../models/User');
const Match = require('../models/Match');
const bcrypt = require('bcryptjs');

// Create a new room
exports.createRoom = async (req, res) => {
    try {
        const {
            title,
            description,
            gameType,
            mode,
            map,
            maxSlots,
            password,
            minLevelRequired,
            region,
            allowSpectators,
            maxSpectators
        } = req.body;

        // Validate required fields
        if (!title || !gameType || !mode || !map) {
            return res.status(400).json({
                success: false,
                message: 'Title, game type, mode, and map are required'
            });
        }

        // Generate unique room code
        const roomCode = await Room.generateRoomCode();

        // Create room data
        const roomData = {
            roomCode,
            title,
            description,
            gameType,
            mode,
            map,
            host: req.user._id,
            minLevelRequired: minLevelRequired || 'none',
            region: region || 'global',
            allowSpectators: allowSpectators !== undefined ? allowSpectators : true
        };

        // Set max slots based on mode or custom value
        if (maxSlots) {
            roomData.maxSlots = maxSlots;
        }

        // Set password if provided (hash it)
        if (password) {
            const salt = await bcrypt.genSalt(10);
            roomData.password = await bcrypt.hash(password, salt);
            roomData.isPasswordProtected = true;
        }

        if (maxSpectators !== undefined) {
            roomData.maxSpectators = maxSpectators;
        }

        // Create room
        const room = new Room(roomData);
        await room.save();

        // Auto-add host as first participant
        const user = await User.findById(req.user._id);
        room.addParticipant(
            req.user._id,
            user.inGameName || user.username,
            user.inGameId || ''
        );
        await room.save();

        // Populate room data
        await room.populate('host', 'username avatar email');
        await room.populate('participants.user', 'username avatar email inGameName inGameId');

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('room_created', {
                room: {
                    _id: room._id,
                    roomCode: room.roomCode,
                    title: room.title,
                    mode: room.mode,
                    map: room.map,
                    gameType: room.gameType,
                    filledSlots: room.filledSlots,
                    maxSlots: room.maxSlots,
                    status: room.status,
                    host: room.host
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            room
        });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create room'
        });
    }
};

// Get all rooms (with filters)
exports.getRooms = async (req, res) => {
    try {
        const {
            status,
            mode,
            gameType,
            map,
            search,
            page = 1,
            limit = 20
        } = req.query;

        // Build filter
        const filter = {};

        if (status) {
            filter.status = status;
        } else {
            // By default, only show active rooms
            filter.status = { $in: ['waiting', 'filling', 'ready'] };
        }

        if (mode) filter.mode = mode;
        if (gameType) filter.gameType = gameType;
        if (map) filter.map = map;
        if (search) {
            // Escape regex special characters to prevent ReDoS attacks
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { title: { $regex: escapedSearch, $options: 'i' } },
                { roomCode: search }
            ];
        }

        // Pagination (clamp limit to prevent excessive data dumps)
        const clampedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
        const skip = (parseInt(page) - 1) * clampedLimit;

        // Get rooms
        const rooms = await Room.find(filter)
            .populate('host', 'username avatar email')
            .populate('participants.user', 'username avatar inGameName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(clampedLimit);

        const total = await Room.countDocuments(filter);

        res.json({
            success: true,
            rooms,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rooms'
        });
    }
};

// Get room by code
exports.getRoomByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const room = await Room.findOne({ roomCode: code })
            .populate('host', 'username avatar email inGameName inGameId level')
            .populate('participants.user', 'username avatar email inGameName inGameId level')
            .populate('spectators.user', 'username avatar email')
            .populate('match');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            room
        });
    } catch (error) {
        console.error('Get room by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch room'
        });
    }
};

// Get room by ID
exports.getRoomById = async (req, res) => {
    try {
        const { id } = req.params;

        const room = await Room.findById(id)
            .populate('host', 'username avatar email inGameName inGameId level')
            .populate('participants.user', 'username avatar email inGameName inGameId level')
            .populate('spectators.user', 'username avatar email')
            .populate('match');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.json({
            success: true,
            room
        });
    } catch (error) {
        console.error('Get room by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch room'
        });
    }
};

// Join room
exports.joinRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, inGameName, inGameId } = req.body;

        const room = await Room.findById(id)
            .populate('host', 'username avatar email')
            .populate('participants.user', 'username avatar email inGameName inGameId');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if room is joinable
        const { joinable, reason } = room.isJoinable();
        if (!joinable) {
            return res.status(400).json({
                success: false,
                message: reason
            });
        }

        // Check password if protected
        if (room.isPasswordProtected) {
            const roomWithPassword = await Room.findById(id).select('+password');
            const isPasswordValid = await bcrypt.compare(password || '', roomWithPassword.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Incorrect password'
                });
            }
        }

        // Check user level requirement
        if (room.minLevelRequired && room.minLevelRequired !== 'none') {
            const user = await User.findById(req.user._id);
            const levels = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
            const userLevelIndex = levels.indexOf(user.level || 'bronze');
            const requiredLevelIndex = levels.indexOf(room.minLevelRequired);

            if (userLevelIndex < requiredLevelIndex) {
                return res.status(403).json({
                    success: false,
                    message: `Minimum level required: ${room.minLevelRequired}`
                });
            }
        }

        // Add participant
        const user = await User.findById(req.user._id);
        const { slotNumber, teamNumber } = room.addParticipant(
            req.user._id,
            inGameName || user.inGameName || user.username,
            inGameId || user.inGameId || ''
        );
        await room.save();

        // Populate after save
        await room.populate('participants.user', 'username avatar email inGameName inGameId');

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`room_${room._id}`).emit('participant_joined', {
                roomId: room._id,
                participant: room.participants[room.participants.length - 1],
                filledSlots: room.filledSlots,
                availableSlots: room.availableSlots
            });
        }

        res.json({
            success: true,
            message: 'Joined room successfully',
            room,
            slotNumber,
            teamNumber
        });
    } catch (error) {
        console.error('Join room error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to join room'
        });
    }
};

// Leave room
exports.leaveRoom = async (req, res) => {
    try {
        const { id } = req.params;

        const room = await Room.findById(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if user is participant
        if (!room.isParticipant(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'You are not in this room'
            });
        }

        // Don't allow host to leave (they should close the room instead)
        if (room.isHost(req.user._id)) {
            return res.status(400).json({
                success: false,
                message: 'Host cannot leave. Please close the room instead.'
            });
        }

        // Remove participant
        room.removeParticipant(req.user._id);
        await room.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`room_${room._id}`).emit('participant_left', {
                roomId: room._id,
                userId: req.user._id,
                filledSlots: room.filledSlots,
                availableSlots: room.availableSlots
            });
        }

        res.json({
            success: true,
            message: 'Left room successfully'
        });
    } catch (error) {
        console.error('Leave room error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to leave room'
        });
    }
};

// Update room settings (host only)
exports.updateRoomSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const { mode, map, maxSlots, region, allowSpectators, maxSpectators } = req.body;

        const room = await Room.findById(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if user is host
        if (!room.isHost(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only the host can update room settings'
            });
        }

        // Update settings
        if (mode && ['solo', 'duo', 'squad'].includes(mode)) {
            room.mode = mode;
        }
        if (map) room.map = map;
        if (maxSlots) room.maxSlots = maxSlots;
        if (region) room.region = region;
        if (allowSpectators !== undefined) room.allowSpectators = allowSpectators;
        if (maxSpectators !== undefined) room.maxSpectators = maxSpectators;

        await room.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`room_${room._id}`).emit('room_settings_update', {
                roomId: room._id,
                settings: { mode, map, maxSlots, region, allowSpectators, maxSpectators }
            });
        }

        res.json({
            success: true,
            message: 'Room settings updated',
            room
        });
    } catch (error) {
        console.error('Update room settings error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update room settings'
        });
    }
};

// Start room (create match and transition)
exports.startRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            entryFee,
            prizePool,
            prizeDistribution,
            perKillPrize,
            roomId,
            roomPassword
        } = req.body;

        const room = await Room.findById(id)
            .populate('participants.user', 'username email inGameName inGameId wallet');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if user is host
        if (!room.isHost(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only the host can start the room'
            });
        }

        // Check if room has participants
        if (room.participants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot start room with no participants'
            });
        }

        // Create match from room
        const matchData = {
            title: room.title,
            description: room.description,
            gameType: room.gameType,
            matchType: 'match_win',
            mode: room.mode,
            map: room.map,
            entryFee: entryFee || 0,
            prizePool: prizePool || 0,
            prizeDistribution: prizeDistribution || [],
            perKillPrize: perKillPrize || 0,
            maxSlots: room.maxSlots,
            filledSlots: room.participants.length,
            scheduledAt: new Date(Date.now() + 10 * 60 * 1000), // Start in 10 minutes
            status: 'room_revealed',
            createdBy: req.user._id,
            host: req.user._id,
            roomId: roomId || '',
            roomPassword: roomPassword || ''
        };

        // Add joined users from room participants
        matchData.joinedUsers = room.participants.map(p => ({
            user: p.user._id,
            inGameName: p.inGameName,
            inGameId: p.inGameId,
            slotNumber: p.slotNumber,
            entryPaid: true
        }));

        const match = new Match(matchData);
        await match.save();

        // Update room
        room.status = 'started';
        room.match = match._id;
        room.startedAt = new Date();
        await room.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`room_${room._id}`).emit('room_started', {
                roomId: room._id,
                matchId: match._id,
                message: 'Room has started! Redirecting to match...'
            });
        }

        res.json({
            success: true,
            message: 'Room started successfully',
            match,
            room
        });
    } catch (error) {
        console.error('Start room error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to start room'
        });
    }
};

// Close room (host only)
exports.closeRoom = async (req, res) => {
    try {
        const { id } = req.params;

        const room = await Room.findById(id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if user is host
        if (!room.isHost(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only the host can close the room'
            });
        }

        room.status = 'closed';
        room.closedAt = new Date();
        await room.save();

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`room_${room._id}`).emit('room_closed', {
                roomId: room._id,
                message: 'Room has been closed by the host'
            });
        }

        res.json({
            success: true,
            message: 'Room closed successfully'
        });
    } catch (error) {
        console.error('Close room error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to close room'
        });
    }
};

// Kick participant (host only)
exports.kickParticipant = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const room = await Room.findById(id)
            .populate('participants.user', 'username avatar email');

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if user is host
        if (!room.isHost(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Only the host can kick participants'
            });
        }

        // Cannot kick host
        if (room.isHost(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot kick the host'
            });
        }

        // Remove participant
        room.removeParticipant(userId);
        await room.save();

        // Emit socket events
        const io = req.app.get('io');
        if (io) {
            // Notify room
            io.to(`room_${room._id}`).emit('participant_kicked', {
                roomId: room._id,
                userId: userId,
                filledSlots: room.filledSlots,
                availableSlots: room.availableSlots
            });

            // Notify kicked user
            io.to(`user_${userId}`).emit('kicked_from_room', {
                roomId: room._id,
                message: 'You have been removed from the room by the host'
            });
        }

        res.json({
            success: true,
            message: 'Participant kicked successfully'
        });
    } catch (error) {
        console.error('Kick participant error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to kick participant'
        });
    }
};
