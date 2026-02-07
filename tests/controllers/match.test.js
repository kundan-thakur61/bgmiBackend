const request = require('supertest');
const { Match, User, Transaction } = require('../../models');

// Cloudinary is mocked globally in tests/mocks.js

const app = require('../app');
const {
  createTestUser,
  createTestAdmin,
  createTestMatch,
  setupAuthenticatedUser,
  setupAuthenticatedAdmin,
  generateAuthToken,
  joinUserToMatch
} = require('../helpers');

describe('Match Controller', () => {
  
  describe('GET /api/matches', () => {
    it('should return list of matches', async () => {
      const admin = await createTestAdmin();
      await createTestMatch(admin);
      await createTestMatch(admin, { title: 'Match 2' });
      
      const res = await request(app)
        .get('/api/matches');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.matches.length).toBe(2);
    });

    it('should filter by game type', async () => {
      const admin = await createTestAdmin();
      await createTestMatch(admin, { gameType: 'pubg_mobile' });
      await createTestMatch(admin, { gameType: 'free_fire', matchType: 'match_win' });
      
      const res = await request(app)
        .get('/api/matches?gameType=pubg_mobile');
      
      expect(res.status).toBe(200);
      expect(res.body.matches.every(m => m.gameType === 'pubg_mobile')).toBe(true);
    });

    it('should filter by match type', async () => {
      const admin = await createTestAdmin();
      await createTestMatch(admin, { matchType: 'match_win', mode: 'solo' });
      await createTestMatch(admin, { matchType: 'tournament', mode: 'duo' });
      
      const res = await request(app)
        .get('/api/matches?matchType=match_win');
      
      expect(res.status).toBe(200);
      expect(res.body.matches.every(m => m.matchType === 'match_win')).toBe(true);
    });

    it('should filter by status', async () => {
      const admin = await createTestAdmin();
      await createTestMatch(admin, { status: 'upcoming' });
      await createTestMatch(admin, { status: 'registration_open' });
      await createTestMatch(admin, { status: 'live' });
      
      const res = await request(app)
        .get('/api/matches?status=upcoming');
      
      expect(res.status).toBe(200);
      expect(res.body.matches.every(m => m.status === 'upcoming')).toBe(true);
    });

    it('should paginate results', async () => {
      const admin = await createTestAdmin();
      for (let i = 0; i < 15; i++) {
        await createTestMatch(admin, { title: `Match ${i}` });
      }
      
      const res = await request(app)
        .get('/api/matches?page=1&limit=10');
      
      expect(res.status).toBe(200);
      expect(res.body.matches.length).toBe(10);
      expect(res.body.pagination.total).toBe(15);
    });

    it('should not return room credentials', async () => {
      const admin = await createTestAdmin();
      await createTestMatch(admin, {
        roomId: 'SECRET123',
        roomPassword: 'SECRET_PASS'
      });
      
      const res = await request(app)
        .get('/api/matches');
      
      expect(res.body.matches[0].roomId).toBeUndefined();
      expect(res.body.matches[0].roomPassword).toBeUndefined();
    });
  });

  describe('GET /api/matches/upcoming', () => {
    it('should return upcoming matches', async () => {
      const admin = await createTestAdmin();
      await createTestMatch(admin, { status: 'upcoming' });
      await createTestMatch(admin, { status: 'registration_open' });
      
      const res = await request(app)
        .get('/api/matches/upcoming');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/matches/live', () => {
    it('should return live matches', async () => {
      const admin = await createTestAdmin();
      await createTestMatch(admin, { status: 'live' });
      
      const res = await request(app)
        .get('/api/matches/live');
      
      expect(res.status).toBe(200);
      expect(res.body.matches.every(m => m.status === 'live')).toBe(true);
    });
  });

  describe('GET /api/matches/:id', () => {
    it('should return single match', async () => {
      const admin = await createTestAdmin();
      const match = await createTestMatch(admin);
      
      const res = await request(app)
        .get(`/api/matches/${match._id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.match._id.toString()).toBe(match._id.toString());
    });

    it('should return 404 for non-existent match', async () => {
      const res = await request(app)
        .get('/api/matches/507f1f77bcf86cd799439011');
      
      expect(res.status).toBe(404);
    });

    it('should indicate if user has joined', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 1000 });
      const match = await createTestMatch(admin);
      
      await joinUserToMatch(user, match);
      
      const res = await request(app)
        .get(`/api/matches/${match._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.userJoined).toBe(true);
      expect(res.body.userSlot).toBeDefined();
    });
  });

  describe('POST /api/matches/:id/join', () => {
    it('should join match successfully', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 500 });
      const match = await createTestMatch(admin, { entryFee: 50 });
      
      const res = await request(app)
        .post(`/api/matches/${match._id}/join`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          inGameId: '12345678',
          inGameName: 'ProPlayer'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.slotNumber).toBeDefined();
      
      // Check user balance deducted
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.walletBalance).toBe(450);
    });

    it('should fail with insufficient balance', async () => {
      const admin = await createTestAdmin();
      const { token } = await setupAuthenticatedUser({ walletBalance: 10 });
      const match = await createTestMatch(admin, { entryFee: 50 });
      
      const res = await request(app)
        .post(`/api/matches/${match._id}/join`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          inGameId: '12345678',
          inGameName: 'ProPlayer'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient');
    });

    it('should fail if already joined', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 1000 });
      const match = await createTestMatch(admin);
      
      await joinUserToMatch(user, match);
      
      const res = await request(app)
        .post(`/api/matches/${match._id}/join`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          inGameId: '12345678',
          inGameName: 'ProPlayer'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already joined');
    });

    it('should fail if match is full', async () => {
      const admin = await createTestAdmin();
      const match = await createTestMatch(admin, { maxSlots: 2 });
      
      // Fill the match with 2 users
      const user1 = await createTestUser({ walletBalance: 1000 });
      await joinUserToMatch(user1, match);
      const user2 = await createTestUser({ walletBalance: 1000 });
      await joinUserToMatch(user2, match);
      
      const { token } = await setupAuthenticatedUser({ walletBalance: 1000 });
      
      const res = await request(app)
        .post(`/api/matches/${match._id}/join`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          inGameId: '12345678',
          inGameName: 'ProPlayer'
        });
      
      expect(res.status).toBe(400);
    });

    it('should fail for closed registration', async () => {
      const admin = await createTestAdmin();
      const match = await createTestMatch(admin, { status: 'live' });
      const { token } = await setupAuthenticatedUser({ walletBalance: 1000 });
      
      const res = await request(app)
        .post(`/api/matches/${match._id}/join`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          inGameId: '12345678',
          inGameName: 'ProPlayer'
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/matches/:id/leave', () => {
    it('should leave match and get partial refund', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 1000 });
      
      // Create match scheduled far in future
      const match = await createTestMatch(admin, {
        entryFee: 100,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
      });
      
      await joinUserToMatch(user, match);
      
      const balanceAfterJoin = 1000 - 100;
      user.walletBalance = balanceAfterJoin;
      await user.save();
      
      const res = await request(app)
        .post(`/api/matches/${match._id}/leave`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.refundAmount).toBe(90); // 10% cancellation fee
    });

    it('should fail if not joined', async () => {
      const admin = await createTestAdmin();
      const match = await createTestMatch(admin);
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .post(`/api/matches/${match._id}/leave`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(400);
    });

    it('should fail if match already started', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 1000 });
      const match = await createTestMatch(admin, { status: 'live' });
      
      match.addUser(user._id, 'TestPlayer', '12345678');
      await match.save();
      
      const res = await request(app)
        .post(`/api/matches/${match._id}/leave`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/matches/:id/room', () => {
    it('should return room credentials for joined user', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 1000 });
      const match = await createTestMatch(admin, {
        roomId: 'ROOM123',
        roomPassword: 'PASS123',
        roomCredentialsVisible: true
      });
      
      await joinUserToMatch(user, match);
      
      const res = await request(app)
        .get(`/api/matches/${match._id}/room`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.roomId).toBe('ROOM123');
      expect(res.body.roomPassword).toBe('PASS123');
    });

    it('should fail if user has not joined', async () => {
      const admin = await createTestAdmin();
      const match = await createTestMatch(admin, { roomCredentialsVisible: true });
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get(`/api/matches/${match._id}/room`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });

    it('should fail if credentials not yet visible', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 1000 });
      const match = await createTestMatch(admin, { roomCredentialsVisible: false });
      
      await joinUserToMatch(user, match);
      
      const res = await request(app)
        .get(`/api/matches/${match._id}/room`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(400);
    });
  });

  describe('Admin Match Operations', () => {
    describe('POST /api/matches (Admin Create)', () => {
      it('should create match as admin', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        
        const res = await request(app)
          .post('/api/matches')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'New Tournament Match',
            gameType: 'pubg_mobile',
            matchType: 'match_win',
            mode: 'squad',
            map: 'erangel',
            entryFee: 100,
            prizePool: 1000,
            perKillPrize: 15,
            maxSlots: 100,
            scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.match.title).toBe('New Tournament Match');
      });

      it('should fail for non-admin users', async () => {
        const { token } = await setupAuthenticatedUser();
        
        const res = await request(app)
          .post('/api/matches')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'Unauthorized Match',
            gameType: 'pubg_mobile',
            matchType: 'solo'
          });
        
        expect(res.status).toBe(403);
      });
    });

    describe('PUT /api/matches/:id (Admin Update)', () => {
      it('should update match as admin', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const match = await createTestMatch(admin);
        
        const res = await request(app)
          .put(`/api/matches/${match._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'Updated Match Title',
            prizePool: 2000
          });
        
        expect(res.status).toBe(200);
        expect(res.body.match.title).toBe('Updated Match Title');
        expect(res.body.match.prizePool).toBe(2000);
      });

      it('should not update completed matches', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const match = await createTestMatch(admin, { status: 'completed' });
        
        const res = await request(app)
          .put(`/api/matches/${match._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ title: 'Should Not Update' });
        
        expect(res.status).toBe(400);
      });
    });

    describe('DELETE /api/matches/:id (Admin Delete)', () => {
      it('should delete match without participants', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const match = await createTestMatch(admin);
        
        const res = await request(app)
          .delete(`/api/matches/${match._id}`)
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        
        const deletedMatch = await Match.findById(match._id);
        expect(deletedMatch).toBeNull();
      });

      it('should not delete match with participants', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const match = await createTestMatch(admin);
        
        const user = await createTestUser({ walletBalance: 1000 });
        await joinUserToMatch(user, match);
        
        const res = await request(app)
          .delete(`/api/matches/${match._id}`)
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(400);
      });
    });

    describe('POST /api/matches/:id/cancel (Admin Cancel)', () => {
      it('should cancel match and refund participants', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const match = await createTestMatch(admin, { entryFee: 100 });
        
        const user = await createTestUser({ walletBalance: 1000 });
        await joinUserToMatch(user, match);
        
        const res = await request(app)
          .post(`/api/matches/${match._id}/cancel`)
          .set('Authorization', `Bearer ${token}`)
          .send({ reason: 'Technical issues' });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Check match status
        const cancelledMatch = await Match.findById(match._id);
        expect(cancelledMatch.status).toBe('cancelled');
        
        // Check user refunded
        const refundTransaction = await Transaction.findOne({
          user: user._id,
          category: 'match_refund'
        });
        expect(refundTransaction).toBeTruthy();
        expect(refundTransaction.amount).toBe(100);
      });
    });

    describe('POST /api/matches/:id/room-credentials (Admin Set)', () => {
      it('should set room credentials', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const match = await createTestMatch(admin);
        
        const res = await request(app)
          .post(`/api/matches/${match._id}/room-credentials`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            roomId: 'ROOM123',
            roomPassword: 'PASS456',
            revealNow: true
          });
        
        expect(res.status).toBe(200);
        expect(res.body.roomCredentialsVisible).toBe(true);
        
        const updatedMatch = await Match.findById(match._id).select('+roomId +roomPassword');
        expect(updatedMatch.roomId).toBe('ROOM123');
        expect(updatedMatch.roomPassword).toBe('PASS456');
      });
    });

    describe('POST /api/matches/:id/start (Admin Start)', () => {
      it('should start match', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const match = await createTestMatch(admin, { status: 'room_revealed' });
        
        const res = await request(app)
          .post(`/api/matches/${match._id}/start`)
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('live');
      });
    });
  });
});
