const request = require('supertest');
const app = require('../app');
const { Notification } = require('../../models');
const {
  setupAuthenticatedUser,
  generateAuthToken
} = require('../helpers');

describe('Notification Controller', () => {
  
  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      // Create notifications
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Welcome',
        message: 'Welcome to BattleZone!'
      });
      
      await Notification.create({
        user: user._id,
        type: 'prize_credited',
        title: 'Prize Won',
        message: 'You won ₹100'
      });
      
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.notifications.length).toBe(2);
      expect(res.body.unreadCount).toBe(2);
    });

    it('should filter unread only', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Read Notification',
        message: 'This is read',
        isRead: true
      });
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Unread Notification',
        message: 'This is unread',
        isRead: false
      });
      
      const res = await request(app)
        .get('/api/notifications?unreadOnly=true')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBe(1);
      expect(res.body.notifications[0].title).toBe('Unread Notification');
    });

    it('should paginate results', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      // Create 5 notifications
      for (let i = 0; i < 5; i++) {
        await Notification.create({
          user: user._id,
          type: 'system',
          title: `Notification ${i}`,
          message: `Message ${i}`
        });
      }
      
      const res = await request(app)
        .get('/api/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBe(2);
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.pagination.pages).toBe(3);
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Notification 1',
        message: 'Test',
        isRead: false
      });
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Notification 2',
        message: 'Test',
        isRead: false
      });
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Notification 3',
        message: 'Test',
        isRead: true
      });
      
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.unreadCount).toBe(2);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const notification = await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Test',
        message: 'Test message',
        isRead: false
      });
      
      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.notification.isRead).toBe(true);
    });

    it('should fail for other user notification', async () => {
      const { user } = await setupAuthenticatedUser();
      const { token: otherToken } = await setupAuthenticatedUser();
      
      const notification = await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Test',
        message: 'Test message'
      });
      
      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${otherToken}`);
      
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Notification 1',
        message: 'Test',
        isRead: false
      });
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Notification 2',
        message: 'Test',
        isRead: false
      });
      
      const res = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify all are read
      const unreadCount = await Notification.countDocuments({ user: user._id, isRead: false });
      expect(unreadCount).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete notification', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const notification = await Notification.create({
        user: user._id,
        type: 'system',
        title: 'To Delete',
        message: 'This will be deleted'
      });
      
      const res = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify deleted
      const deleted = await Notification.findById(notification._id);
      expect(deleted).toBeNull();
    });

    it('should fail for other user notification', async () => {
      const { user } = await setupAuthenticatedUser();
      const { token: otherToken } = await setupAuthenticatedUser();
      
      const notification = await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Protected',
        message: 'Should not be deleted'
      });
      
      const res = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set('Authorization', `Bearer ${otherToken}`);
      
      expect(res.status).toBe(404);
    });
  });

  describe('Notification Static Methods', () => {
    it('should create and push notification', async () => {
      const { user } = await setupAuthenticatedUser();
      
      const notification = await Notification.createAndPush({
        user: user._id,
        type: 'prize_credited',
        title: 'Prize Won',
        message: 'You won ₹500!'
      });
      
      expect(notification).toBeDefined();
      expect(notification.type).toBe('prize_credited');
    });

    it('should get unread count', async () => {
      const { user } = await setupAuthenticatedUser();
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Test 1',
        message: 'Message',
        isRead: false
      });
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Test 2',
        message: 'Message',
        isRead: true
      });
      
      const count = await Notification.getUnreadCount(user._id);
      expect(count).toBe(1);
    });

    it('should mark all as read', async () => {
      const { user } = await setupAuthenticatedUser();
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Test 1',
        message: 'Message'
      });
      
      await Notification.create({
        user: user._id,
        type: 'system',
        title: 'Test 2',
        message: 'Message'
      });
      
      await Notification.markAllRead(user._id);
      
      const unread = await Notification.countDocuments({ user: user._id, isRead: false });
      expect(unread).toBe(0);
    });
  });
});
