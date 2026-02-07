const request = require('supertest');
const app = require('../app');
const { Ticket, User } = require('../../models');
const {
  createTestUser,
  setupAuthenticatedUser,
  setupAuthenticatedAdmin,
  generateAuthToken
} = require('../helpers');

// Helper to create support user
const createSupportUser = async () => {
  const user = await createTestUser({ role: 'support' });
  const token = generateAuthToken(user);
  return { user, token };
};

describe('Ticket Controller', () => {
  
  describe('GET /api/tickets', () => {
    it('should return user tickets', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      // Create a ticket
      await Ticket.create({
        user: user._id,
        subject: 'Test Ticket',
        category: 'account',
        messages: [{
          sender: user._id,
          senderType: 'user',
          message: 'Test message'
        }]
      });
      
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tickets.length).toBe(1);
    });

    it('should filter by status', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      await Ticket.create({
        user: user._id,
        subject: 'Open Ticket',
        category: 'account',
        status: 'open',
        messages: [{ sender: user._id, senderType: 'user', message: 'Test' }]
      });
      
      await Ticket.create({
        user: user._id,
        subject: 'Closed Ticket',
        category: 'account',
        status: 'closed',
        messages: [{ sender: user._id, senderType: 'user', message: 'Test' }]
      });
      
      const res = await request(app)
        .get('/api/tickets?status=open')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.tickets.length).toBe(1);
      expect(res.body.tickets[0].status).toBe('open');
    });
  });

  describe('POST /api/tickets', () => {
    it('should create a ticket', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          subject: 'Payment Issue',
          category: 'payment',
          message: 'I have an issue with my payment'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.ticketId).toBeDefined();
    });

    it('should fail without required fields', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          subject: 'Test'
          // missing category and message
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('should return ticket details', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const ticket = await Ticket.create({
        user: user._id,
        subject: 'Test Ticket',
        category: 'technical',
        messages: [{
          sender: user._id,
          senderType: 'user',
          message: 'Need help'
        }]
      });
      
      const res = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.subject).toBe('Test Ticket');
    });

    it('should fail for other user ticket', async () => {
      const { user } = await setupAuthenticatedUser();
      const { token: otherToken } = await setupAuthenticatedUser();
      
      const ticket = await Ticket.create({
        user: user._id,
        subject: 'Private Ticket',
        category: 'account',
        messages: [{ sender: user._id, senderType: 'user', message: 'Test' }]
      });
      
      const res = await request(app)
        .get(`/api/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${otherToken}`);
      
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/tickets/:id/message', () => {
    it('should add message to ticket', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const ticket = await Ticket.create({
        user: user._id,
        subject: 'Test Ticket',
        category: 'account',
        messages: [{ sender: user._id, senderType: 'user', message: 'Initial message' }]
      });
      
      const res = await request(app)
        .post(`/api/tickets/${ticket._id}/message`)
        .set('Authorization', `Bearer ${token}`)
        .send({ message: 'Follow up message' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const updated = await Ticket.findById(ticket._id);
      expect(updated.messages.length).toBe(2);
    });
  });

  describe('POST /api/tickets/:id/close', () => {
    it('should close ticket', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const ticket = await Ticket.create({
        user: user._id,
        subject: 'Test Ticket',
        category: 'account',
        messages: [{ sender: user._id, senderType: 'user', message: 'Test' }]
      });
      
      const res = await request(app)
        .post(`/api/tickets/${ticket._id}/close`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const updated = await Ticket.findById(ticket._id);
      expect(updated.status).toBe('closed');
    });
  });

  describe('POST /api/tickets/:id/rate', () => {
    it('should rate resolved ticket', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const ticket = await Ticket.create({
        user: user._id,
        subject: 'Test Ticket',
        category: 'account',
        status: 'resolved',
        messages: [{ sender: user._id, senderType: 'user', message: 'Test' }]
      });
      
      const res = await request(app)
        .post(`/api/tickets/${ticket._id}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 5, feedback: 'Great support!' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      const updated = await Ticket.findById(ticket._id);
      expect(updated.rating).toBe(5);
    });

    it('should fail for open ticket', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const ticket = await Ticket.create({
        user: user._id,
        subject: 'Open Ticket',
        category: 'account',
        status: 'open',
        messages: [{ sender: user._id, senderType: 'user', message: 'Test' }]
      });
      
      const res = await request(app)
        .post(`/api/tickets/${ticket._id}/rate`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 5 });
      
      expect(res.status).toBe(400);
    });
  });

  describe('Admin Ticket Operations', () => {
    describe('GET /api/tickets/admin/all', () => {
      it('should return all tickets for support/admin', async () => {
        const { token } = await createSupportUser();
        const user = await createTestUser();
        
        await Ticket.create({
          user: user._id,
          subject: 'User Ticket',
          category: 'payment',
          messages: [{ sender: user._id, senderType: 'user', message: 'Help' }]
        });
        
        const res = await request(app)
          .get('/api/tickets/admin/all')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.tickets.length).toBeGreaterThan(0);
      });

      it('should fail for regular users', async () => {
        const { token } = await setupAuthenticatedUser();
        
        const res = await request(app)
          .get('/api/tickets/admin/all')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/tickets/:id/assign', () => {
      it('should assign ticket', async () => {
        const { user: support, token } = await createSupportUser();
        const user = await createTestUser();
        
        const ticket = await Ticket.create({
          user: user._id,
          subject: 'Test Ticket',
          category: 'technical',
          messages: [{ sender: user._id, senderType: 'user', message: 'Help' }]
        });
        
        const res = await request(app)
          .post(`/api/tickets/${ticket._id}/assign`)
          .set('Authorization', `Bearer ${token}`)
          .send({ assigneeId: support._id });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        const updated = await Ticket.findById(ticket._id);
        expect(updated.assignedTo.toString()).toBe(support._id.toString());
      });
    });

    describe('POST /api/tickets/:id/resolve', () => {
      it('should resolve ticket', async () => {
        const { token } = await createSupportUser();
        const user = await createTestUser();
        
        const ticket = await Ticket.create({
          user: user._id,
          subject: 'Test Ticket',
          category: 'account',
          status: 'in_progress',
          messages: [{ sender: user._id, senderType: 'user', message: 'Issue' }]
        });
        
        const res = await request(app)
          .post(`/api/tickets/${ticket._id}/resolve`)
          .set('Authorization', `Bearer ${token}`)
          .send({ resolution: 'Issue has been resolved' });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        const updated = await Ticket.findById(ticket._id);
        expect(updated.status).toBe('resolved');
      });
    });
  });
});
