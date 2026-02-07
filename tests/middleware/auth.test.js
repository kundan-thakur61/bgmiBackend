const request = require('supertest');
const app = require('../app');
const { User } = require('../../models');
const {
  createTestUser,
  createTestAdmin,
  createKYCVerifiedUser,
  generateAuthToken,
  setupAuthenticatedUser
} = require('../helpers');

describe('Auth Middleware', () => {
  
  describe('auth middleware', () => {
    it('should allow access with valid token', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/users/profile');
      
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('token');
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token-here');
      
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid');
    });

    it('should reject request with malformed authorization header', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'NotBearer token');
      
      expect(res.status).toBe(401);
    });

    it('should reject banned user', async () => {
      const user = await createTestUser({ isBanned: true, banReason: 'Cheating' });
      const token = generateAuthToken(user);
      
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('banned');
    });

    it('should reject inactive user', async () => {
      const user = await createTestUser({ isActive: false });
      const token = generateAuthToken(user);
      
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('inactive');
    });
  });

  describe('authorize middleware (role-based)', () => {
    it('should allow admin access to admin routes', async () => {
      const admin = await createTestAdmin();
      const token = generateAuthToken(admin);
      
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
    });

    it('should deny regular user access to admin routes', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('permission');
    });

    it('should allow super_admin access to all admin routes', async () => {
      const superAdmin = await createTestUser({ role: 'super_admin' });
      const token = generateAuthToken(superAdmin);
      
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
    });
  });
});

describe('Error Handler Middleware', () => {
  
  it('should handle 404 routes', async () => {
    const res = await request(app)
      .get('/api/non-existent-route');
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });

  it('should handle validation errors', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ phone: 'invalid' });
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should handle invalid ObjectId errors', async () => {
    const { token } = await setupAuthenticatedUser();
    
    const res = await request(app)
      .get('/api/matches/invalid-id')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(400);
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const res = await request(app)
      .get('/health');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});
