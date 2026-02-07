const { Friendship, User, Notification } = require('../models');
const { BadRequestError, NotFoundError } = require('../middleware/errorHandler');

// @desc    Send friend request
// @route   POST /api/social/friends/request
// @access  Private
exports.sendFriendRequest = async (req, res, next) => {
    try {
        const { recipientId } = req.body;

        if (!recipientId) {
            throw new BadRequestError('Recipient ID is required');
        }

        if (recipientId === req.user.id.toString()) {
            throw new BadRequestError('You cannot send a friend request to yourself');
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            throw new NotFoundError('User not found');
        }

        // Check if friendship already exists
        const existingFriendship = await Friendship.findOne({
            $or: [
                { requester: req.user.id, recipient: recipientId },
                { requester: recipientId, recipient: req.user.id }
            ]
        });

        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                throw new BadRequestError('You are already friends');
            }
            if (existingFriendship.status === 'pending') {
                throw new BadRequestError('Friend request already sent');
            }
            if (existingFriendship.status === 'blocked') {
                throw new BadRequestError('Cannot send friend request');
            }
        }

        // Create friendship
        const friendship = await Friendship.create({
            requester: req.user.id,
            recipient: recipientId,
            status: 'pending'
        });

        // Send notification to recipient
        await Notification.create({
            user: recipientId,
            type: 'friend_request',
            title: 'New Friend Request',
            message: `${req.user.username} sent you a friend request`,
            data: { friendshipId: friendship._id, from: req.user.id }
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${recipientId}`).emit('friend_request', {
                friendshipId: friendship._id,
                from: {
                    id: req.user.id,
                    username: req.user.username,
                    avatar: req.user.avatar
                }
            });
        }

        res.status(201).json({
            success: true,
            message: 'Friend request sent',
            data: friendship
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Respond to friend request
// @route   PUT /api/social/friends/request/:friendshipId
// @access  Private
exports.respondToFriendRequest = async (req, res, next) => {
    try {
        const { friendshipId } = req.params;
        const { action } = req.body; // 'accept' or 'decline'

        if (!['accept', 'decline'].includes(action)) {
            throw new BadRequestError('Invalid action. Must be "accept" or "decline"');
        }

        const friendship = await Friendship.findById(friendshipId);

        if (!friendship) {
            throw new NotFoundError('Friend request not found');
        }

        if (friendship.recipient.toString() !== req.user.id.toString()) {
            throw new BadRequestError('You can only respond to requests sent to you');
        }

        if (friendship.status !== 'pending') {
            throw new BadRequestError('This request has already been responded to');
        }

        if (action === 'accept') {
            friendship.accept();

            // Notify requester
            await Notification.create({
                user: friendship.requester,
                type: 'friend_accepted',
                title: 'Friend Request Accepted',
                message: `${req.user.username} accepted your friend request`,
                data: { friendshipId: friendship._id }
            });

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${friendship.requester}`).emit('friend_accepted', {
                    friendshipId: friendship._id,
                    by: {
                        id: req.user.id,
                        username: req.user.username,
                        avatar: req.user.avatar
                    }
                });
            }
        } else {
            friendship.decline();
        }

        await friendship.save();

        res.json({
            success: true,
            message: `Friend request ${action}ed`,
            data: friendship
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get friend list
// @route   GET /api/social/friends
// @access  Private
exports.getFriends = async (req, res, next) => {
    try {
        const friends = await Friendship.getFriends(req.user.id);

        res.json({
            success: true,
            count: friends.length,
            data: friends
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get online friends
// @route   GET /api/social/friends/online
// @access  Private
exports.getOnlineFriends = async (req, res, next) => {
    try {
        const friends = await Friendship.getFriends(req.user.id);

        // Filter for online friends
        const onlineFriends = friends.filter(friend => friend.isOnline);

        res.json({
            success: true,
            count: onlineFriends.length,
            data: onlineFriends
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get pending friend requests
// @route   GET /api/social/friends/requests
// @access  Private
exports.getPendingRequests = async (req, res, next) => {
    try {
        const { type = 'received' } = req.query; // 'received' or 'sent'

        let query = { status: 'pending' };

        if (type === 'received') {
            query.recipient = req.user.id;
        } else {
            query.requester = req.user.id;
        }

        const requests = await Friendship.find(query)
            .populate('requester', 'username avatar gameId')
            .populate('recipient', 'username avatar gameId')
            .sort({ requestedAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove friend
// @route   DELETE /api/social/friends/:friendshipId
// @access  Private
exports.removeFriend = async (req, res, next) => {
    try {
        const { friendshipId } = req.params;

        const friendship = await Friendship.findById(friendshipId);

        if (!friendship) {
            throw new NotFoundError('Friendship not found');
        }

        // Check if user is part of this friendship
        if (friendship.requester.toString() !== req.user.id.toString() &&
            friendship.recipient.toString() !== req.user.id.toString()) {
            throw new BadRequestError('You are not part of this friendship');
        }

        await friendship.deleteOne();

        res.json({
            success: true,
            message: 'Friend removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Block user
// @route   POST /api/social/block/:userId
// @access  Private
exports.blockUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (userId === req.user.id.toString()) {
            throw new BadRequestError('You cannot block yourself');
        }

        // Find or create friendship
        let friendship = await Friendship.findOne({
            $or: [
                { requester: req.user.id, recipient: userId },
                { requester: userId, recipient: req.user.id }
            ]
        });

        if (friendship) {
            friendship.block();
            await friendship.save();
        } else {
            friendship = await Friendship.create({
                requester: req.user.id,
                recipient: userId,
                status: 'blocked'
            });
        }

        res.json({
            success: true,
            message: 'User blocked successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Invite friend to match
// @route   POST /api/social/invite/match
// @access  Private
exports.inviteToMatch = async (req, res, next) => {
    try {
        const { friendId, matchId, message } = req.body;

        // Check if they are friends
        const areFriends = await Friendship.areFriends(req.user.id, friendId);

        if (!areFriends) {
            throw new BadRequestError('You can only invite friends');
        }

        // Send notification
        await Notification.create({
            user: friendId,
            type: 'match_invitation',
            title: 'Match Invitation',
            message: message || `${req.user.username} invited you to join a match`,
            data: { matchId, from: req.user.id }
        });

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${friendId}`).emit('match_invitation', {
                matchId,
                from: {
                    id: req.user.id,
                    username: req.user.username,
                    avatar: req.user.avatar
                },
                message
            });
        }

        res.json({
            success: true,
            message: 'Invitation sent'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Search users to add as friends
// @route   GET /api/social/users/search
// @access  Private
exports.searchUsers = async (req, res, next) => {
    try {
        const { query } = req.query;

        if (!query || query.length < 2) {
            throw new BadRequestError('Search query must be at least 2 characters');
        }

        const users = await User.find({
            $and: [
                { _id: { $ne: req.user.id } },
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { gameId: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        })
            .select('username avatar gameId')
            .limit(20);

        // Check friendship status for each user
        const usersWithStatus = await Promise.all(users.map(async (user) => {
            const friendship = await Friendship.findOne({
                $or: [
                    { requester: req.user.id, recipient: user._id },
                    { requester: user._id, recipient: req.user.id }
                ]
            });

            return {
                ...user.toObject(),
                friendshipStatus: friendship ? friendship.status : 'none',
                friendshipId: friendship ? friendship._id : null
            };
        }));

        res.json({
            success: true,
            count: usersWithStatus.length,
            data: usersWithStatus
        });
    } catch (error) {
        next(error);
    }
};

module.exports = exports;
