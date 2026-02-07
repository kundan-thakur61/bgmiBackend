const request = require('supertest');
const app = require('../app');
const { Withdrawal, User, Transaction } = require('../../models');
const {
  createTestUser,
  createTestAdmin,
  setupAuthenticatedUser,
  setupAuthenticatedAdmin,
  createKYCVerifiedUser,
  generateAuthToken
} = require('../helpers');

describe('Withdrawal Controller', () => {
  
  describe('GET /api/withdrawals', () => {
    it('should return user withdrawals', async () => {
      const user = await createKYCVerifiedUser({ walletBalance: 1000 });
      const token = generateAuthToken(user);
      
      // Create withdrawal with all required fields
      await Withdrawal.create({
        user: user._id,
        amount: 100,
        netAmount: 100,
        method: 'upi',
        upiId: 'test@upi',
        status: 'pending',
        walletBalanceAtRequest: 1000
      });
      
      const res = await request(app)
        .get('/api/withdrawals')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.withdrawals.length).toBe(1);
    });
  });

  describe('POST /api/withdrawals', () => {
    it('should create withdrawal request for KYC verified user', async () => {
      const user = await createKYCVerifiedUser({ walletBalance: 1000 });
      const token = generateAuthToken(user);
      
      const res = await request(app)
        .post('/api/withdrawals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 100,
          method: 'upi',
          upiId: 'test@upi'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.withdrawal.amount).toBe(100);
    });

    it('should fail for non-KYC verified user', async () => {
      const { user, token } = await setupAuthenticatedUser({ 
        walletBalance: 1000, 
        isKycVerified: false 
      });
      
      const res = await request(app)
        .post('/api/withdrawals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 100,
          method: 'upi',
          upiId: 'test@upi'
        });
      
      // KYC middleware returns 403
      expect(res.status).toBe(403);
    });

    it('should fail with insufficient balance', async () => {
      const user = await createKYCVerifiedUser({ walletBalance: 50 });
      const token = generateAuthToken(user);
      
      const res = await request(app)
        .post('/api/withdrawals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 100,
          method: 'upi',
          upiId: 'test@upi'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient');
    });
  });

  describe('DELETE /api/withdrawals/:id', () => {
    it('should cancel pending withdrawal', async () => {
      const user = await createKYCVerifiedUser({ walletBalance: 900 });
      const token = generateAuthToken(user);
      
      // Create withdrawal (simulating amount already deducted)
      const withdrawal = await Withdrawal.create({
        user: user._id,
        amount: 100,
        netAmount: 100,
        method: 'upi',
        upiId: 'test@upi',
        status: 'pending',
        walletBalanceAtRequest: 1000
      });
      
      const res = await request(app)
        .delete(`/api/withdrawals/${withdrawal._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Check withdrawal status
      const updatedWithdrawal = await Withdrawal.findById(withdrawal._id);
      expect(updatedWithdrawal.status).toBe('cancelled');
    });
  });

  describe('GET /api/withdrawals/check-eligibility', () => {
    it('should return eligibility status', async () => {
      const user = await createKYCVerifiedUser({ walletBalance: 1000 });
      const token = generateAuthToken(user);
      
      const res = await request(app)
        .get('/api/withdrawals/check-eligibility')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.eligible).toBe(true);
    });
  });

  describe('Admin Withdrawal Operations', () => {
    describe('GET /api/withdrawals/pending (Admin)', () => {
      it('should return pending withdrawals for admin', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        
        // Create a pending withdrawal
        const user = await createKYCVerifiedUser({ walletBalance: 1000 });
        await Withdrawal.create({
          user: user._id,
          amount: 100,
          netAmount: 100,
          method: 'upi',
          upiId: 'test@upi',
          status: 'pending',
          walletBalanceAtRequest: 1000
        });
        
        const res = await request(app)
          .get('/api/withdrawals/pending')
          .set('Authorization', `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.withdrawals.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/withdrawals/:id/approve (Admin)', () => {
      it('should approve withdrawal', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const user = await createKYCVerifiedUser({ walletBalance: 1000 });
        
        const withdrawal = await Withdrawal.create({
          user: user._id,
          amount: 100,
          netAmount: 100,
          method: 'upi',
          upiId: 'test@upi',
          status: 'pending',
          walletBalanceAtRequest: 1000
        });
        
        const res = await request(app)
          .post(`/api/withdrawals/${withdrawal._id}/approve`)
          .set('Authorization', `Bearer ${token}`)
          .send({ notes: 'Approved' });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        const updatedWithdrawal = await Withdrawal.findById(withdrawal._id);
        expect(updatedWithdrawal.status).toBe('approved');
      });
    });

    describe('POST /api/withdrawals/:id/reject (Admin)', () => {
      it('should reject withdrawal with reason', async () => {
        const { admin, token } = await setupAuthenticatedAdmin();
        const user = await createKYCVerifiedUser({ walletBalance: 900 });
        
        const withdrawal = await Withdrawal.create({
          user: user._id,
          amount: 100,
          netAmount: 100,
          method: 'upi',
          upiId: 'test@upi',
          status: 'pending',
          walletBalanceAtRequest: 1000
        });
        
        const res = await request(app)
          .post(`/api/withdrawals/${withdrawal._id}/reject`)
          .set('Authorization', `Bearer ${token}`)
          .send({ reason: 'Invalid UPI ID' });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        const updatedWithdrawal = await Withdrawal.findById(withdrawal._id);
        expect(updatedWithdrawal.status).toBe('rejected');
      });
    });
  });
});
