const request = require('supertest');
const app = require('../app');
const { KYC, User } = require('../../models');
const {
  createTestUser,
  createTestAdmin,
  setupAuthenticatedUser,
  setupAuthenticatedAdmin
} = require('../helpers');

describe('KYC Controller', () => {
  
  describe('GET /api/kyc/status', () => {
    it('should return KYC status for user', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.kycStatus).toBeDefined();
    });

    it('should return pending status after submission', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      // Create KYC record
      await KYC.create({
        user: user._id,
        fullName: 'Test User',
        dateOfBirth: new Date('1995-01-01'),
        gender: 'male',
        address: {
          line1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          pincode: '123456'
        },
        documentType: 'aadhaar',
        documentNumber: '123412341234',
        status: 'pending'
      });
      
      await User.findByIdAndUpdate(user._id, { kycStatus: 'pending' });
      
      const res = await request(app)
        .get('/api/kyc/status')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.kycStatus).toBe('pending');
    });
  });

  describe('Admin KYC Operations', () => {
    describe('GET /api/kyc/pending (Admin)', () => {
      it('should return pending KYC list for admin', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        
        // Create a user with pending KYC
        const user = await createTestUser();
        await KYC.create({
          user: user._id,
          fullName: 'Test User',
          dateOfBirth: new Date('1995-01-01'),
          gender: 'male',
          address: {
            line1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456'
          },
          documentType: 'aadhaar',
          documentNumber: '123412341234',
          status: 'pending'
        });
        
        const res = await request(app)
          .get('/api/kyc/pending')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.kycs.length).toBeGreaterThan(0);
      });

      it('should fail for non-admin users', async () => {
        const { token } = await setupAuthenticatedUser();
        
        const res = await request(app)
          .get('/api/kyc/pending')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/kyc/:id/approve (Admin)', () => {
      it('should approve KYC', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const user = await createTestUser();
        
        const kyc = await KYC.create({
          user: user._id,
          fullName: 'Test User',
          dateOfBirth: new Date('1995-01-01'),
          gender: 'male',
          address: {
            line1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456'
          },
          documentType: 'aadhaar',
          documentNumber: '123412341234',
          status: 'pending'
        });
        
        const res = await request(app)
          .post(`/api/kyc/${kyc._id}/approve`)
          .set('Authorization', `Bearer ${token}`)
          .send({ notes: 'Verified successfully' });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Check KYC status updated
        const updatedKyc = await KYC.findById(kyc._id);
        expect(updatedKyc.status).toBe('approved');
      });
    });

    describe('POST /api/kyc/:id/reject (Admin)', () => {
      it('should reject KYC with reason', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const user = await createTestUser();
        
        const kyc = await KYC.create({
          user: user._id,
          fullName: 'Test User',
          dateOfBirth: new Date('1995-01-01'),
          gender: 'male',
          address: {
            line1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456'
          },
          documentType: 'aadhaar',
          documentNumber: '123412341234',
          status: 'pending'
        });
        
        const res = await request(app)
          .post(`/api/kyc/${kyc._id}/reject`)
          .set('Authorization', `Bearer ${token}`)
          .send({ reason: 'Document unclear' });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Check KYC status updated
        const updatedKyc = await KYC.findById(kyc._id);
        expect(updatedKyc.status).toBe('rejected');
      });

      it('should fail without reason', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const user = await createTestUser();
        
        const kyc = await KYC.create({
          user: user._id,
          fullName: 'Test User',
          dateOfBirth: new Date('1995-01-01'),
          gender: 'male',
          address: {
            line1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            pincode: '123456'
          },
          documentType: 'aadhaar',
          documentNumber: '123412341234',
          status: 'pending'
        });
        
        const res = await request(app)
          .post(`/api/kyc/${kyc._id}/reject`)
          .set('Authorization', `Bearer ${token}`)
          .send({});
        
        expect(res.status).toBe(400);
      });
    });
  });
});
