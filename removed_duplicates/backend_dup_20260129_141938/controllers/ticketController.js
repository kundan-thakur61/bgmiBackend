const { Ticket, Notification, AdminLog } = require('../models');
const { uploadImage } = require('../config/cloudinary');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

// Get my tickets
exports.getMyTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.userId };
    if (status) query.status = status;
    
    const tickets = await Ticket.find(query)
      .select('ticketId subject category status priority createdAt lastActivityAt')
      .sort({ lastActivityAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Ticket.countDocuments(query);
    
    res.json({
      success: true,
      tickets,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// Create ticket
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, category, message, relatedMatch, relatedTournament, relatedTransaction, relatedWithdrawal } = req.body;
    
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadImage(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, 'battlezone/tickets');
        attachments.push({ url: result.url, publicId: result.publicId, type: file.mimetype, name: file.originalname });
      }
    }
    
    const ticket = await Ticket.create({
      user: req.userId,
      subject,
      category,
      relatedMatch,
      relatedTournament,
      relatedTransaction,
      relatedWithdrawal,
      messages: [{ sender: req.userId, senderType: 'user', message, attachments }]
    });
    
    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      ticket: { id: ticket._id, ticketId: ticket.ticketId, status: ticket.status }
    });
  } catch (error) {
    next(error);
  }
};

// Get single ticket
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('messages.sender', 'name avatar role')
      .populate('assignedTo', 'name')
      .populate('relatedMatch', 'title')
      .populate('relatedTournament', 'title');
    
    if (!ticket) throw new NotFoundError('Ticket not found');
    
    const isAdmin = ['support', 'admin', 'super_admin'].includes(req.user.role);
    if (ticket.user.toString() !== req.userId.toString() && !isAdmin) {
      throw new ForbiddenError('Access denied');
    }
    
    // Mark messages as read
    if (ticket.user.toString() === req.userId.toString()) {
      ticket.messages.forEach(msg => {
        if (msg.senderType === 'admin') msg.isRead = true;
      });
      await ticket.save();
    }
    
    res.json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

// Add message to ticket
exports.addMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) throw new NotFoundError('Ticket not found');
    
    const isAdmin = ['support', 'admin', 'super_admin'].includes(req.user.role);
    if (ticket.user.toString() !== req.userId.toString() && !isAdmin) {
      throw new ForbiddenError('Access denied');
    }
    
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadImage(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, 'battlezone/tickets');
        attachments.push({ url: result.url, publicId: result.publicId, type: file.mimetype, name: file.originalname });
      }
    }
    
    const senderType = isAdmin ? 'admin' : 'user';
    ticket.addMessage(req.userId, senderType, message, attachments);
    
    if (senderType === 'user' && ticket.status === 'waiting_for_user') {
      ticket.status = 'in_progress';
    }
    
    await ticket.save();
    
    // Notify the other party
    if (senderType === 'admin') {
      await Notification.createAndPush({
        user: ticket.user,
        type: 'ticket_response',
        title: 'Support Response',
        message: `You have a new response on ticket #${ticket.ticketId}`,
        reference: { type: 'ticket', id: ticket._id }
      });
    }
    
    res.json({ success: true, message: 'Message added successfully' });
  } catch (error) {
    next(error);
  }
};

// Close ticket
exports.closeTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) throw new NotFoundError('Ticket not found');
    
    if (ticket.user.toString() !== req.userId.toString()) {
      throw new ForbiddenError('Access denied');
    }
    
    ticket.close();
    await ticket.save();
    
    res.json({ success: true, message: 'Ticket closed' });
  } catch (error) {
    next(error);
  }
};

// Rate ticket
exports.rateTicket = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) throw new NotFoundError('Ticket not found');
    if (ticket.user.toString() !== req.userId.toString()) throw new ForbiddenError('Access denied');
    if (!['resolved', 'closed'].includes(ticket.status)) throw new BadRequestError('Can only rate resolved tickets');
    
    ticket.rate(rating, feedback);
    await ticket.save();
    
    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all tickets
exports.getAllTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, priority, assignedTo } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    
    const tickets = await Ticket.find(query)
      .populate('user', 'name phone')
      .populate('assignedTo', 'name')
      .sort({ priority: -1, createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Ticket.countDocuments(query);
    
    const stats = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      tickets,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      stats
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Assign ticket
exports.assignTicket = async (req, res, next) => {
  try {
    const { assigneeId } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) throw new NotFoundError('Ticket not found');
    
    ticket.assign(assigneeId || req.userId);
    await ticket.save();
    
    await AdminLog.log({
      admin: req.userId,
      action: 'ticket_assign',
      targetType: 'ticket',
      targetId: ticket._id,
      description: `Assigned ticket #${ticket.ticketId}`,
      ip: req.ip
    });
    
    res.json({ success: true, message: 'Ticket assigned' });
  } catch (error) {
    next(error);
  }
};

// Admin: Resolve ticket
exports.resolveTicket = async (req, res, next) => {
  try {
    const { resolution } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) throw new NotFoundError('Ticket not found');
    
    ticket.resolve(req.userId, resolution);
    await ticket.save();
    
    await Notification.createAndPush({
      user: ticket.user,
      type: 'ticket_response',
      title: 'Ticket Resolved',
      message: `Your ticket #${ticket.ticketId} has been resolved.`,
      reference: { type: 'ticket', id: ticket._id }
    });
    
    await AdminLog.log({
      admin: req.userId,
      action: 'ticket_resolve',
      targetType: 'ticket',
      targetId: ticket._id,
      description: `Resolved ticket #${ticket.ticketId}`,
      ip: req.ip
    });
    
    res.json({ success: true, message: 'Ticket resolved' });
  } catch (error) {
    next(error);
  }
};
