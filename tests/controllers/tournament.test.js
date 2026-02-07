const request = require('supertest');
const app = require('../app');
const { Tournament, User, Transaction } = require('../../models');
const {
  createTestUser,
  createTestAdmin,
  generateAuthToken,
  setupAuthenticatedUser,
  setupAuthenticatedAdmin
} = require('../helpers');

// Helper to create test tournament
const createTestTournament = async (createdBy, overrides = {}) => {
  const defaultTournament = {
    title: 'Test Tournament',
    gameType: 'pubg_mobile',
    format: 'battle_royale',
    mode: 'solo',
    entryFee: 100,
    prizePool: 5000,
    maxTeams: 100,
    registrationStartAt: new Date(),
    registrationEndAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    startAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    status: 'registration_open',
    createdBy: createdBy._id,
    prizeDistribution: [
      { position: 1, prize: 2500, label: '1st Place' },
      { position: 2, prize: 1500, label: '2nd Place' },
      { position: 3, prize: 1000, label: '3rd Place' }
    ],
    pointSystem: {
      kill: 1,
      placement: [10, 8, 6, 5, 4, 3, 2, 1]
    }
  };

  const tournamentData = { ...defaultTournament, ...overrides };
  const tournament = await Tournament.create(tournamentData);
  return tournament;
};

describe('Tournament Controller', () => {
  
  describe('GET /api/tournaments', () => {
    it('should return list of tournaments', async () => {
      const admin = await createTestAdmin();
      await createTestTournament(admin);
      await createTestTournament(admin, { title: 'Tournament 2' });
      
      const res = await request(app).get('/api/tournaments');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tournaments.length).toBe(2);
    });

    it('should filter by game type', async () => {
      const admin = await createTestAdmin();
      await createTestTournament(admin, { gameType: 'pubg_mobile' });
      await createTestTournament(admin, { gameType: 'free_fire' });
      
      const res = await request(app).get('/api/tournaments?gameType=pubg_mobile');
      
      expect(res.status).toBe(200);
      expect(res.body.tournaments.every(t => t.gameType === 'pubg_mobile')).toBe(true);
    });

    it('should paginate results', async () => {
      const admin = await createTestAdmin();
      for (let i = 0; i < 15; i++) {
        await createTestTournament(admin, { title: `Tournament ${i}` });
      }
      
      const res = await request(app).get('/api/tournaments?page=1&limit=10');
      
      expect(res.status).toBe(200);
      expect(res.body.tournaments.length).toBe(10);
      expect(res.body.pagination.total).toBe(15);
    });
  });

  describe('GET /api/tournaments/featured', () => {
    it('should return featured tournaments', async () => {
      const admin = await createTestAdmin();
      await createTestTournament(admin, { isFeatured: true });
      await createTestTournament(admin, { isFeatured: false });
      
      const res = await request(app).get('/api/tournaments/featured');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/tournaments/:id', () => {
    it('should return single tournament', async () => {
      const admin = await createTestAdmin();
      const tournament = await createTestTournament(admin);
      
      const res = await request(app).get(`/api/tournaments/${tournament._id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tournament._id.toString()).toBe(tournament._id.toString());
    });

    it('should return 404 for non-existent tournament', async () => {
      const res = await request(app).get('/api/tournaments/507f1f77bcf86cd799439011');
      
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/tournaments/:id/register', () => {
    it('should register user for tournament', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 500 });
      const tournament = await createTestTournament(admin, { entryFee: 100 });
      
      const res = await request(app)
        .post(`/api/tournaments/${tournament._id}/register`)
        .set('Authorization', `Bearer ${token}`)
        .send({ teamName: 'TestTeam' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.slotNumber).toBeDefined();
    });

    it('should fail with insufficient balance', async () => {
      const admin = await createTestAdmin();
      const { token } = await setupAuthenticatedUser({ walletBalance: 10 });
      const tournament = await createTestTournament(admin, { entryFee: 100 });
      
      const res = await request(app)
        .post(`/api/tournaments/${tournament._id}/register`)
        .set('Authorization', `Bearer ${token}`)
        .send({ teamName: 'TestTeam' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient');
    });

    it('should fail if already registered', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 500 });
      const tournament = await createTestTournament(admin);
      
      // First registration
      await request(app)
        .post(`/api/tournaments/${tournament._id}/register`)
        .set('Authorization', `Bearer ${token}`)
        .send({ teamName: 'TestTeam' });
      
      // Second registration should fail
      const res = await request(app)
        .post(`/api/tournaments/${tournament._id}/register`)
        .set('Authorization', `Bearer ${token}`)
        .send({ teamName: 'TestTeam2' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already');
    });
  });

  describe('POST /api/tournaments/:id/leave', () => {
    it('should leave tournament and get partial refund', async () => {
      const admin = await createTestAdmin();
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 500 });
      const tournament = await createTestTournament(admin, { 
        entryFee: 100,
        registrationEndAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      });
      
      // Register first
      await request(app)
        .post(`/api/tournaments/${tournament._id}/register`)
        .set('Authorization', `Bearer ${token}`)
        .send({ teamName: 'TestTeam' });
      
      const res = await request(app)
        .post(`/api/tournaments/${tournament._id}/leave`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.refundAmount).toBe(90); // 10% cancellation fee
    });
  });

  describe('GET /api/tournaments/:id/leaderboard', () => {
    it('should return tournament leaderboard', async () => {
      const admin = await createTestAdmin();
      const tournament = await createTestTournament(admin);
      
      const res = await request(app).get(`/api/tournaments/${tournament._id}/leaderboard`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.leaderboard).toBeDefined();
    });
  });

  describe('Admin Tournament Operations', () => {
    describe('POST /api/tournaments (Admin Create)', () => {
      it('should create tournament as admin', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        
        const res = await request(app)
          .post('/api/tournaments')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'New Tournament',
            gameType: 'pubg_mobile',
            format: 'battle_royale',
            mode: 'squad',
            entryFee: 200,
            prizePool: 10000,
            maxTeams: 50,
            registrationStartAt: new Date(),
            registrationEndAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            startAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
          });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.tournament.title).toBe('New Tournament');
      });

      it('should fail for non-admin users', async () => {
        const { token } = await setupAuthenticatedUser();
        
        const res = await request(app)
          .post('/api/tournaments')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'Unauthorized Tournament',
            gameType: 'pubg_mobile'
          });
        
        expect(res.status).toBe(403);
      });
    });

    describe('PUT /api/tournaments/:id (Admin Update)', () => {
      it('should update tournament as admin', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const tournament = await createTestTournament(admin);
        
        const res = await request(app)
          .put(`/api/tournaments/${tournament._id}`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'Updated Tournament',
            prizePool: 7500
          });
        
        expect(res.status).toBe(200);
        expect(res.body.tournament.title).toBe('Updated Tournament');
        expect(res.body.tournament.prizePool).toBe(7500);
      });
    });

    describe('DELETE /api/tournaments/:id (Admin Delete)', () => {
      it('should delete tournament without participants', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const tournament = await createTestTournament(admin);
        
        const res = await request(app)
          .delete(`/api/tournaments/${tournament._id}`)
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        
        const deletedTournament = await Tournament.findById(tournament._id);
        expect(deletedTournament).toBeNull();
      });
    });
  });
});
