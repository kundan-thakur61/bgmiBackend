const { Team, User, Notification } = require('../models');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

// Get my teams
exports.getMyTeams = async (req, res, next) => {
    try {
        const teams = await Team.find({
            'members.user': req.userId,
            isActive: true
        })
            .populate('captain', 'name avatar')
            .populate('members.user', 'name avatar level')
            .lean();

        res.json({
            success: true,
            teams
        });
    } catch (error) {
        next(error);
    }
};

// Get team by ID
exports.getTeam = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('captain', 'name avatar level')
            .populate('members.user', 'name avatar level gameProfiles')
            .lean();

        if (!team) {
            throw new NotFoundError('Team not found');
        }

        res.json({
            success: true,
            team
        });
    } catch (error) {
        next(error);
    }
};

// Create team
exports.createTeam = async (req, res, next) => {
    try {
        const { name, tag, description, gameType, maxMembers } = req.body;

        // Check if user is already captain of a team
        const existingTeam = await Team.findOne({ captain: req.userId, isActive: true });
        if (existingTeam) {
            throw new BadRequestError('You are already captain of a team. Leave or disband it first.');
        }

        // Create team with creator as captain and first member
        const team = await Team.create({
            name,
            tag: tag.toUpperCase(),
            description,
            gameType: gameType || 'all',
            maxMembers: maxMembers || 4,
            captain: req.userId,
            members: [{
                user: req.userId,
                role: 'captain'
            }]
        });

        await team.populate('captain', 'name avatar');
        await team.populate('members.user', 'name avatar level');

        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            team
        });
    } catch (error) {
        next(error);
    }
};

// Update team
exports.updateTeam = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            throw new NotFoundError('Team not found');
        }

        if (!team.isCaptain(req.userId)) {
            throw new ForbiddenError('Only captain can update team');
        }

        const allowedUpdates = ['name', 'tag', 'description', 'gameType', 'isPublic'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                team[field] = req.body[field];
            }
        });

        await team.save();

        res.json({
            success: true,
            message: 'Team updated',
            team
        });
    } catch (error) {
        next(error);
    }
};

// Invite member to team
exports.inviteMember = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const team = await Team.findById(req.params.id);

        if (!team) {
            throw new NotFoundError('Team not found');
        }

        if (!team.isCaptain(req.userId) && !team.members.some(m => m.user.toString() === req.userId.toString() && m.role === 'co-captain')) {
            throw new ForbiddenError('Only captain or co-captain can invite members');
        }

        if (team.isFull()) {
            throw new BadRequestError('Team is full');
        }

        if (team.isMember(userId)) {
            throw new BadRequestError('User is already a member');
        }

        if (team.hasPendingInvite(userId)) {
            throw new BadRequestError('User already has a pending invite');
        }

        // Check if user exists
        const invitedUser = await User.findById(userId);
        if (!invitedUser) {
            throw new NotFoundError('User not found');
        }

        // Add invite
        team.invites.push({
            user: userId,
            invitedBy: req.userId
        });

        await team.save();

        // Send notification
        await Notification.createNotification(
            userId,
            'system',
            'Team Invite',
            `You've been invited to join team "${team.name}"`,
            { actionUrl: `/teams`, actionText: 'View Invite' }
        );

        res.json({
            success: true,
            message: 'Invite sent successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Get pending invites for current user
exports.getMyInvites = async (req, res, next) => {
    try {
        const teams = await Team.find({
            'invites.user': req.userId,
            'invites.status': 'pending',
            isActive: true
        })
            .populate('captain', 'name avatar')
            .select('name tag captain members invites');

        const invites = teams.map(team => {
            const invite = team.invites.find(
                i => i.user.toString() === req.userId.toString() && i.status === 'pending'
            );
            return {
                teamId: team._id,
                teamName: team.name,
                teamTag: team.tag,
                captain: team.captain,
                memberCount: team.members.length,
                invitedAt: invite.createdAt,
                expiresAt: invite.expiresAt
            };
        });

        res.json({
            success: true,
            invites
        });
    } catch (error) {
        next(error);
    }
};

// Accept team invite
exports.acceptInvite = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            throw new NotFoundError('Team not found');
        }

        const inviteIndex = team.invites.findIndex(
            i => i.user.toString() === req.userId.toString() && i.status === 'pending'
        );

        if (inviteIndex === -1) {
            throw new BadRequestError('No pending invite found');
        }

        const invite = team.invites[inviteIndex];

        // Check if invite expired
        if (new Date() > invite.expiresAt) {
            team.invites[inviteIndex].status = 'expired';
            await team.save();
            throw new BadRequestError('Invite has expired');
        }

        if (team.isFull()) {
            throw new BadRequestError('Team is now full');
        }

        // Add member
        team.addMember(req.userId);
        team.invites[inviteIndex].status = 'accepted';
        await team.save();

        // Notify captain
        await Notification.createNotification(
            team.captain,
            'system',
            'New Team Member',
            `${req.user.name || 'A player'} has joined your team "${team.name}"`,
            { actionUrl: `/teams/${team._id}`, actionText: 'View Team' }
        );

        res.json({
            success: true,
            message: 'Joined team successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Decline team invite
exports.declineInvite = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            throw new NotFoundError('Team not found');
        }

        const inviteIndex = team.invites.findIndex(
            i => i.user.toString() === req.userId.toString() && i.status === 'pending'
        );

        if (inviteIndex === -1) {
            throw new BadRequestError('No pending invite found');
        }

        team.invites[inviteIndex].status = 'declined';
        await team.save();

        res.json({
            success: true,
            message: 'Invite declined'
        });
    } catch (error) {
        next(error);
    }
};

// Leave team
exports.leaveTeam = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            throw new NotFoundError('Team not found');
        }

        if (!team.isMember(req.userId)) {
            throw new BadRequestError('You are not a member of this team');
        }

        if (team.isCaptain(req.userId)) {
            throw new BadRequestError('Captain cannot leave. Transfer captaincy or disband team.');
        }

        team.removeMember(req.userId);
        await team.save();

        res.json({
            success: true,
            message: 'Left team successfully'
        });
    } catch (error) {
        next(error);
    }
};

// Remove member (captain only)
exports.removeMember = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const team = await Team.findById(req.params.id);

        if (!team) {
            throw new NotFoundError('Team not found');
        }

        if (!team.isCaptain(req.userId)) {
            throw new ForbiddenError('Only captain can remove members');
        }

        if (userId === req.userId.toString()) {
            throw new BadRequestError('Cannot remove yourself. Use disband instead.');
        }

        team.removeMember(userId);
        await team.save();

        // Notify removed user
        await Notification.createNotification(
            userId,
            'system',
            'Removed from Team',
            `You have been removed from team "${team.name}"`,
            { priority: 'high' }
        );

        res.json({
            success: true,
            message: 'Member removed'
        });
    } catch (error) {
        next(error);
    }
};

// Transfer captaincy
exports.transferCaptaincy = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const team = await Team.findById(req.params.id);

        if (!team) {
            throw new NotFoundError('Team not found');
        }

        if (!team.isCaptain(req.userId)) {
            throw new ForbiddenError('Only captain can transfer captaincy');
        }

        if (!team.isMember(userId)) {
            throw new BadRequestError('New captain must be a team member');
        }

        // Update roles
        const oldCaptainIndex = team.members.findIndex(m => m.user.toString() === req.userId.toString());
        const newCaptainIndex = team.members.findIndex(m => m.user.toString() === userId);

        team.members[oldCaptainIndex].role = 'member';
        team.members[newCaptainIndex].role = 'captain';
        team.captain = userId;

        await team.save();

        // Notify new captain
        await Notification.createNotification(
            userId,
            'system',
            'You are now Captain',
            `You are now the captain of team "${team.name}"`,
            { actionUrl: `/teams/${team._id}`, actionText: 'View Team', priority: 'high' }
        );

        res.json({
            success: true,
            message: 'Captaincy transferred'
        });
    } catch (error) {
        next(error);
    }
};

// Disband team (captain only)
exports.disbandTeam = async (req, res, next) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            throw new NotFoundError('Team not found');
        }

        if (!team.isCaptain(req.userId)) {
            throw new ForbiddenError('Only captain can disband team');
        }

        // Notify all members
        for (const member of team.members) {
            if (member.user.toString() !== req.userId.toString()) {
                await Notification.createNotification(
                    member.user,
                    'system',
                    'Team Disbanded',
                    `Team "${team.name}" has been disbanded by the captain`,
                    { priority: 'high' }
                );
            }
        }

        // Soft delete
        team.isActive = false;
        await team.save();

        res.json({
            success: true,
            message: 'Team disbanded'
        });
    } catch (error) {
        next(error);
    }
};
