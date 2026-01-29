const { Dispute, Match, Notification, AdminLog } = require('../models');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const { uploadImage } = require('../config/cloudinary');

// Create dispute
exports.createDispute = async (req, res, next) => {
    try {
        const { matchId, reason, description, evidence } = req.body;

        // Check if match exists
        const match = await Match.findById(matchId);
        if (!match) {
            throw new NotFoundError('Match not found');
        }

        // Check if user participated in the match
        const isParticipant = match.joinedUsers.some(
            ju => ju.user.toString() === req.userId.toString()
        );
        if (!isParticipant) {
            throw new ForbiddenError('You can only dispute matches you participated in');
        }

        // Check if match is completed
        if (match.status !== 'completed' && match.status !== 'result_pending') {
            throw new BadRequestError('You can only dispute completed matches');
        }

        // Check for existing dispute
        const hasExisting = await Dispute.hasExistingDispute(matchId, req.userId);
        if (hasExisting) {
            throw new BadRequestError('You already have a pending dispute for this match');
        }

        // Create dispute
        const dispute = await Dispute.create({
            match: matchId,
            submittedBy: req.userId,
            reason,
            description,
            evidence: evidence || [],
            priority: reason === 'cheating' ? 'high' : 'medium'
        });

        // Send notification to admins (could be enhanced with specific admin notification)
        // For now, just log it
        console.log(`New dispute created: ${dispute._id} for match ${matchId}`);

        res.status(201).json({
            success: true,
            message: 'Dispute submitted successfully',
            dispute: {
                _id: dispute._id,
                status: dispute.status,
                createdAt: dispute.createdAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get my disputes
exports.getMyDisputes = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { submittedBy: req.userId };
        if (status) query.status = status;

        const disputes = await Dispute.find(query)
            .populate('match', 'title gameType scheduledAt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Dispute.countDocuments(query);

        res.json({
            success: true,
            disputes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single dispute
exports.getDispute = async (req, res, next) => {
    try {
        const dispute = await Dispute.findById(req.params.id)
            .populate('match', 'title gameType scheduledAt status prizePool')
            .populate('submittedBy', 'name avatar')
            .populate('messages.sender', 'name avatar');

        if (!dispute) {
            throw new NotFoundError('Dispute not found');
        }

        // Only allow submitter or admin to view
        const isAdmin = ['admin', 'super_admin', 'support'].includes(req.user.role);
        if (dispute.submittedBy._id.toString() !== req.userId.toString() && !isAdmin) {
            throw new ForbiddenError('Access denied');
        }

        res.json({
            success: true,
            dispute
        });
    } catch (error) {
        next(error);
    }
};

// Add message to dispute
exports.addMessage = async (req, res, next) => {
    try {
        const { message } = req.body;
        const dispute = await Dispute.findById(req.params.id);

        if (!dispute) {
            throw new NotFoundError('Dispute not found');
        }

        const isAdmin = ['admin', 'super_admin', 'support'].includes(req.user.role);
        if (dispute.submittedBy.toString() !== req.userId.toString() && !isAdmin) {
            throw new ForbiddenError('Access denied');
        }

        dispute.messages.push({
            sender: req.userId,
            message,
            isAdmin
        });

        await dispute.save();

        // Notify the other party
        const notifyUserId = isAdmin ? dispute.submittedBy : dispute.assignedTo;
        if (notifyUserId) {
            await Notification.createNotification(
                notifyUserId,
                'system',
                'New Message on Dispute',
                'You have a new message on your dispute',
                { actionUrl: `/disputes/${dispute._id}`, actionText: 'View' }
            );
        }

        res.json({
            success: true,
            message: 'Message added'
        });
    } catch (error) {
        next(error);
    }
};

// Upload evidence
exports.uploadEvidence = async (req, res, next) => {
    try {
        const dispute = await Dispute.findById(req.params.id);

        if (!dispute) {
            throw new NotFoundError('Dispute not found');
        }

        if (dispute.submittedBy.toString() !== req.userId.toString()) {
            throw new ForbiddenError('Only dispute owner can upload evidence');
        }

        if (dispute.status !== 'pending') {
            throw new BadRequestError('Cannot add evidence to disputes under review');
        }

        if (!req.file) {
            throw new BadRequestError('Please upload a file');
        }

        // Upload to cloudinary
        const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const result = await uploadImage(base64, 'battlezone/disputes');

        dispute.evidence.push({
            type: req.file.mimetype.startsWith('video') ? 'video' : 'screenshot',
            url: result.url,
            description: req.body.description || ''
        });

        await dispute.save();

        res.json({
            success: true,
            message: 'Evidence uploaded',
            evidence: dispute.evidence[dispute.evidence.length - 1]
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Get all disputes
exports.getAllDisputes = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, priority } = req.query;

        const query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;

        const disputes = await Dispute.find(query)
            .populate('match', 'title gameType')
            .populate('submittedBy', 'name avatar')
            .populate('assignedTo', 'name')
            .sort({ priority: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Dispute.countDocuments(query);

        // Get counts by status
        const statusCounts = await Dispute.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            disputes,
            statusCounts: statusCounts.reduce((acc, s) => {
                acc[s._id] = s.count;
                return acc;
            }, {}),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Assign dispute
exports.assignDispute = async (req, res, next) => {
    try {
        const dispute = await Dispute.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    assignedTo: req.body.adminId || req.userId,
                    status: 'under_review',
                    reviewedBy: req.userId,
                    reviewedAt: new Date()
                }
            },
            { new: true }
        );

        if (!dispute) {
            throw new NotFoundError('Dispute not found');
        }

        // Notify user
        await Notification.createNotification(
            dispute.submittedBy,
            'system',
            'Dispute Under Review',
            'Your dispute is now being reviewed by our team',
            { actionUrl: `/disputes/${dispute._id}`, actionText: 'View' }
        );

        res.json({
            success: true,
            message: 'Dispute assigned',
            dispute
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Resolve dispute
exports.resolveDispute = async (req, res, next) => {
    try {
        const { resolution, resolutionNotes, resolutionAction } = req.body;

        const dispute = await Dispute.findById(req.params.id);

        if (!dispute) {
            throw new NotFoundError('Dispute not found');
        }

        dispute.status = 'resolved';
        dispute.resolution = resolution;
        dispute.resolutionNotes = resolutionNotes;
        dispute.resolutionAction = resolutionAction;
        dispute.resolvedBy = req.userId;
        dispute.resolvedAt = new Date();

        await dispute.save();

        // Notify user
        await Notification.createNotification(
            dispute.submittedBy,
            'system',
            'Dispute Resolved',
            `Your dispute has been ${resolution}. Check the details.`,
            { actionUrl: `/disputes/${dispute._id}`, actionText: 'View Resolution', priority: 'high' }
        );

        // Log admin action
        await AdminLog.create({
            admin: req.userId,
            action: 'resolve_dispute',
            targetType: 'dispute',
            targetId: dispute._id,
            details: { resolution, resolutionNotes }
        });

        res.json({
            success: true,
            message: 'Dispute resolved',
            dispute
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Add internal note
exports.addAdminNote = async (req, res, next) => {
    try {
        const dispute = await Dispute.findById(req.params.id);

        if (!dispute) {
            throw new NotFoundError('Dispute not found');
        }

        dispute.adminNotes.push({
            note: req.body.note,
            addedBy: req.userId
        });

        await dispute.save();

        res.json({
            success: true,
            message: 'Note added'
        });
    } catch (error) {
        next(error);
    }
};
