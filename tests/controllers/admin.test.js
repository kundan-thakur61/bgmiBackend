const request = require('supertest');
const app = require('../app');
const { User, Match, Transaction, Announcement, AdminLog } = require('../../models');
const {
  createTestUser,
  createTestAdmin,
  createTestSuperAdmin,
  setupAuthenticatedUser,
  setupAuthenticatedAdmin,
  generateAuthToken,
  createTestMatch
} = require('../helpers');

describe('Admin Controller', () => {
  
  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard data for admin', async () => {
      const { admin, token } = await setupAuthenticatedAdmin();
      
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.dashboard.users).toBeDefined();
      expect(res.body.dashboard.matches).toBeDefined();
    });

    it('should fail for non-admin users', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return stats', async () => {
      const { token } = await setupAuthenticatedAdmin();
      
      const res = await request(app)
        .get('/api/admin/stats?period=7d')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.period).toBe('7d');
    });
  });

  describe('User Management', () => {
    describe('GET /api/admin/users', () => {
      it('should return user list', async () => {
        const { token } = await setupAuthenticatedAdmin();
        
        // Create some users
        await createTestUser({ name: 'User One' });
        await createTestUser({ name: 'User Two' });
        
        const res = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.users.length).toBeGreaterThan(0);
      });

      it('should search users', async () => {
        const { token } = await setupAuthenticatedAdmin();
        await createTestUser({ name: 'SearchableUser' });
        
        const res = await request(app)
          .get('/api/admin/users?search=Searchable')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.users.some(u => u.name.includes('Searchable'))).toBe(true);
      });
    });

    describe('GET /api/admin/users/:id', () => {
      it('should return single user', async () => {
        const { token } = await setupAuthenticatedAdmin();
        const user = await createTestUser({ name: 'Target User' });
        
        const res = await request(app)
          .get(`/api/admin/users/${user._id}`)
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.name).toBe('Target User');
      });
    });

    describe('PUT /api/admin/users/:id', () => {
      it('should update user', async () => {
        const { token } = await setupAuthenticatedAdmin();
        const user = await createTestUser({ name: 'Old Name' });
        
        const res = await request(app)
          .put(`/api/admin/users/${user._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'New Name' });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.name).toBe('New Name');
      });
    });

    describe('POST /api/admin/users/:id/ban', () => {
      it('should ban user', async () => {
        const { token } = await setupAuthenticatedAdmin();
        const user = await createTestUser();
        
        const res = await request(app)
          .post(`/api/admin/users/${user._id}/ban`)
          .set('Authorization', `Bearer ${token}`)
          .send({ reason: 'Cheating' });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        const banned = await User.findById(user._id);
        expect(banned.isBanned).toBe(true);
        expect(banned.banReason).toBe('Cheating');
      });

      it('should not ban super_admin', async () => {
        const { token } = await setupAuthenticatedAdmin();
        const superAdmin = await createTestSuperAdmin();
        
        const res = await request(app)
          .post(`/api/admin/users/${superAdmin._id}/ban`)
          .set('Authorization', `Bearer ${token}`)
          .send({ reason: 'Test' });
        
        expect(res.status).toBe(400);
      });
    });

    describe('POST /api/admin/users/:id/unban', () => {
      it('should unban user', async () => {
        const { token } = await setupAuthenticatedAdmin();
        const user = await createTestUser({ isBanned: true, banReason: 'Test' });
        
        const res = await request(app)
          .post(`/api/admin/users/${user._id}/unban`)
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        const unbanned = await User.findById(user._id);
        expect(unbanned.isBanned).toBe(false);
      });
    });

    describe('POST /api/admin/users/:id/role', () => {
      it('should change user role (super_admin only)', async () => {
        const superAdmin = await createTestSuperAdmin();
        const token = generateAuthToken(superAdmin);
        const user = await createTestUser();
        
        const res = await request(app)
          .post(`/api/admin/users/${user._id}/role`)
          .set('Authorization', `Bearer ${token}`)
          .send({ role: 'admin' });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.role).toBe('admin');
      });

      it('should fail for regular admin', async () => {
        const { token } = await setupAuthenticatedAdmin();
        const user = await createTestUser();
        
        const res = await request(app)
          .post(`/api/admin/users/${user._id}/role`)
          .set('Authorization', `Bearer ${token}`)
          .send({ role: 'admin' });
        
        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/admin/users/:id/wallet', () => {
      it('should credit wallet', async () => {
        const { token } = await setupAuthenticatedAdmin();
        const user = await createTestUser({ walletBalance: 100 });
        
        const res = await request(app)
          .post(`/api/admin/users/${user._id}/wallet`)
          .set('Authorization', `Bearer ${token}`)
          .send({ amount: 50, type: 'credit', reason: 'Refund' });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.newBalance).toBe(150);
      });

      it('should debit wallet', async () => {
        const { token } = await setupAuthenticatedAdmin();
        const user = await createTestUser({ walletBalance: 100 });
        
        const res = await request(app)
          .post(`/api/admin/users/${user._id}/wallet`)
          .set('Authorization', `Bearer ${token}`)
          .send({ amount: 30, type: 'debit', reason: 'Penalty' });
        
        expect(res.status).toBe(200);
        expect(res.body.newBalance).toBe(70);
      });
    });
  });

  describe('Activity Logs', () => {
    describe('GET /api/admin/logs', () => {
      it('should return admin logs', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        
        // Create a log with valid action
        await AdminLog.log({
          admin: admin._id,
          action: 'other',
          targetType: 'user',
          description: 'Test log entry'
        });
        
        const res = await request(app)
          .get('/api/admin/logs')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.logs.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/admin/logs/my-activity', () => {
      it('should return current admin activity', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        
        await AdminLog.log({
          admin: admin._id,
          action: 'login',
          description: 'My activity'
        });
        
        const res = await request(app)
          .get('/api/admin/logs/my-activity')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });

  describe('Announcements', () => {
    describe('GET /api/admin/announcements', () => {
      it('should return announcements', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        
        await Announcement.create({
          title: 'Test Announcement',
          message: 'This is a test',
          type: 'info',
          createdBy: admin._id
        });
        
        const res = await request(app)
          .get('/api/admin/announcements')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.announcements.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/admin/announcements', () => {
      it('should create announcement', async () => {
        const { token } = await setupAuthenticatedAdmin();
        
        const res = await request(app)
          .post('/api/admin/announcements')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'New Announcement',
            message: 'Important update for all users',
            type: 'info'
          });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.announcement.title).toBe('New Announcement');
      });
    });

    describe('PUT /api/admin/announcements/:id', () => {
      it('should update announcement', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        
        const announcement = await Announcement.create({
          title: 'Original',
          message: 'Original message',
          type: 'info',
          createdBy: admin._id
        });
        
        const res = await request(app)
          .put(`/api/admin/announcements/${announcement._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ title: 'Updated Title' });
        
        expect(res.status).toBe(200);
        expect(res.body.announcement.title).toBe('Updated Title');
      });
    });

    describe('DELETE /api/admin/announcements/:id', () => {
      it('should delete announcement', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        
        const announcement = await Announcement.create({
          title: 'To Delete',
          message: 'Will be deleted',
          type: 'info',
          createdBy: admin._id
        });
        
        const res = await request(app)
          .delete(`/api/admin/announcements/${announcement._id}`)
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        const deleted = await Announcement.findById(announcement._id);
        expect(deleted).toBeNull();
      });
    });
  });

  describe('Reports', () => {
    describe('GET /api/admin/reports/revenue', () => {
      it('should return revenue report', async () => {
        const { token } = await setupAuthenticatedAdmin();
        
        const res = await request(app)
          .get('/api/admin/reports/revenue')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.report).toBeDefined();
      });
    });

    describe('GET /api/admin/reports/users', () => {
      it('should return user report', async () => {
        const { token } = await setupAuthenticatedAdmin();
        
        const res = await request(app)
          .get('/api/admin/reports/users')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.report.total).toBeDefined();
      });
    });

    describe('GET /api/admin/reports/matches', () => {
      it('should return match report', async () => {
        const { token } = await setupAuthenticatedAdmin();
        
        const res = await request(app)
          .get('/api/admin/reports/matches')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.report).toBeDefined();
      });
    });
  });
});
