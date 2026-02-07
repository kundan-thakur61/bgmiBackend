const request = require('supertest');
const app = require('../app');
const { User, Match } = require('../../models');
const {
  createTestUser,
  setupAuthenticatedUser,
  createTestMatch,
  createTestAdmin,
  generateAuthToken,
  joinUserToMatch
} = require('../helpers');

describe('User Controller', () => {
  
  describe('GET /api/users/profile', () => {
    it('should return user profile', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user._id.toString()).toBe(user._id.toString());
      expect(res.body.user.name).toBe(user.name);
    });

    it('should not return sensitive fields', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.body.user.otp).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.deviceFingerprints).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/users/profile');
      
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update user profile', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          email: 'updated@test.com'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Updated Name');
      expect(res.body.user.email).toBe('updated@test.com');
    });

    it('should validate age when updating dateOfBirth', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          dateOfBirth: '2015-01-01' // Too young
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('18');
    });

    it('should not update disallowed fields', async () => {
      const { user, token } = await setupAuthenticatedUser();
      const originalBalance = user.walletBalance;
      
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          walletBalance: 10000,
          role: 'admin'
        });
      
      expect(res.status).toBe(200);
      
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.walletBalance).toBe(originalBalance);
      expect(updatedUser.role).toBe('user');
    });
  });

  describe('PUT /api/users/game-profiles', () => {
    it('should update PUBG Mobile profile', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .put('/api/users/game-profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          pubgMobile: {
            inGameId: '5123456789',
            inGameName: 'ProPlayer123'
          }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.gameProfiles.pubgMobile.inGameId).toBe('5123456789');
      expect(res.body.gameProfiles.pubgMobile.inGameName).toBe('ProPlayer123');
    });

    it('should update Free Fire profile', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .put('/api/users/game-profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          freeFire: {
            inGameId: '987654321',
            inGameName: 'FFPlayer'
          }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.gameProfiles.freeFire.inGameId).toBe('987654321');
    });
  });

  describe('GET /api/users/stats', () => {
    it('should return user stats', async () => {
      const { user, token } = await setupAuthenticatedUser({
        matchesPlayed: 10,
        matchesWon: 3,
        totalEarnings: 500,
        xp: 1500
      });
      
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.matchesPlayed).toBe(10);
      expect(res.body.stats.matchesWon).toBe(3);
      expect(res.body.stats.totalEarnings).toBe(500);
    });

    it('should return default stats for new user', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.stats.matchesPlayed).toBe(0);
      expect(res.body.stats.level).toBe('bronze');
    });
  });

  describe('GET /api/users/matches', () => {
    it('should return user match history', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 1000 });
      
      // Create a match and join
      const match = await createTestMatch(admin);
      await joinUserToMatch(user, match);
      
      const res = await request(app)
        .get('/api/users/matches')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.matches.length).toBe(1);
    });

    it('should paginate results', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get('/api/users/matches?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  describe('GET /api/users/referrals', () => {
    it('should return referral info', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      // Create referred users
      await createTestUser({ referredBy: user._id });
      await createTestUser({ referredBy: user._id });
      
      // Update referral count
      user.referralCount = 2;
      await user.save();
      
      const res = await request(app)
        .get('/api/users/referrals')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.referral.code).toBe(user.referralCode);
      expect(res.body.referral.referredUsers.length).toBe(2);
    });
  });

  describe('GET /api/users/notification-preferences', () => {
    it('should return notification preferences', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get('/api/users/notification-preferences')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.preferences).toBeDefined();
      expect(res.body.preferences.matchReminders).toBe(true);
    });
  });

  describe('PUT /api/users/notification-preferences', () => {
    it('should update notification preferences', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .put('/api/users/notification-preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          matchReminders: false,
          promotions: false
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.preferences.matchReminders).toBe(false);
      expect(res.body.preferences.promotions).toBe(false);
    });
  });
});
