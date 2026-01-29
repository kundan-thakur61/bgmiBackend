const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { auth, supportAccess } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');

// User routes
router.get('/', auth, ticketController.getMyTickets);
router.post('/', auth, uploadMultiple('attachments', 3), ticketController.createTicket);
router.get('/:id', auth, ticketController.getTicket);
router.post('/:id/message', auth, uploadMultiple('attachments', 3), ticketController.addMessage);
router.post('/:id/close', auth, ticketController.closeTicket);
router.post('/:id/rate', auth, ticketController.rateTicket);

// Admin routes
router.get('/admin/all', auth, supportAccess, ticketController.getAllTickets);
router.post('/:id/assign', auth, supportAccess, ticketController.assignTicket);
router.post('/:id/resolve', auth, supportAccess, ticketController.resolveTicket);

module.exports = router;
