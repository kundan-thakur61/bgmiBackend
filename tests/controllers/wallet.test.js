const request = require('supertest');
const { User, Transaction } = require('../../models');

// Razorpay is mocked globally in tests/setup.js

const app = require('../app');
const {
  createTestUser,
  setupAuthenticatedUser,
  createTestTransaction,
  generateAuthToken
} = require('../helpers');

describe('Wallet Controller', () => {
  
  describe('GET /api/wallet/balance', () => {
    it('should return wallet balance', async () => {
      const { user, token } = await setupAuthenticatedUser({
        walletBalance: 500,
        bonusBalance: 50
      });
      
      const res = await request(app)
        .get('/api/wallet/balance')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.balance.wallet).toBe(500);
      expect(res.body.balance.bonus).toBe(50);
      expect(res.body.balance.total).toBe(550);
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .get('/api/wallet/balance');
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/wallet/transactions', () => {
    it('should return transaction history', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      // Create test transactions
      await createTestTransaction(user._id, {
        type: 'credit',
        category: 'deposit',
        amount: 100
      });
      await createTestTransaction(user._id, {
        type: 'debit',
        category: 'match_entry',
        amount: 50
      });
      
      const res = await request(app)
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.transactions.length).toBe(2);
    });

    it('should filter by transaction type', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      await createTestTransaction(user._id, { type: 'credit', amount: 100 });
      await createTestTransaction(user._id, { type: 'debit', amount: 50 });
      
      const res = await request(app)
        .get('/api/wallet/transactions?type=credit')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.transactions.every(t => t.type === 'credit')).toBe(true);
    });

    it('should filter by category', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      await createTestTransaction(user._id, { category: 'deposit' });
      await createTestTransaction(user._id, { category: 'match_entry' });
      
      const res = await request(app)
        .get('/api/wallet/transactions?category=deposit')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.transactions.every(t => t.category === 'deposit')).toBe(true);
    });

    it('should paginate results', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      // Create 15 transactions
      for (let i = 0; i < 15; i++) {
        await createTestTransaction(user._id);
      }
      
      const res = await request(app)
        .get('/api/wallet/transactions?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.transactions.length).toBe(10);
      expect(res.body.pagination.total).toBe(15);
      expect(res.body.pagination.pages).toBe(2);
    });
  });

  describe('POST /api/wallet/deposit', () => {
    it('should create deposit order', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .post('/api/wallet/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.id).toBe('order_test123');
      expect(res.body.transactionId).toBeDefined();
    });

    it('should reject amount below minimum', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .post('/api/wallet/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 5 });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Minimum');
    });

    it('should reject amount above maximum', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .post('/api/wallet/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100000 });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Maximum');
    });

    it('should create pending transaction', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      await request(app)
        .post('/api/wallet/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 100 });
      
      const transaction = await Transaction.findOne({
        user: user._id,
        category: 'deposit',
        status: 'pending'
      });
      
      expect(transaction).toBeTruthy();
      expect(transaction.amount).toBe(100);
    });
  });

  describe('POST /api/wallet/verify-payment', () => {
    it('should verify payment and credit balance', async () => {
      const { user, token } = await setupAuthenticatedUser({ walletBalance: 0 });
      
      // Create pending transaction
      const transaction = await Transaction.create({
        user: user._id,
        type: 'credit',
        category: 'deposit',
        amount: 100,
        balanceBefore: 0,
        balanceAfter: 0,
        description: 'Test deposit',
        status: 'pending',
        paymentDetails: {
          gateway: 'razorpay',
          orderId: 'order_test123'
        }
      });
      
      const res = await request(app)
        .post('/api/wallet/verify-payment')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: 'order_test123',
          paymentId: 'pay_test123',
          signature: 'test_signature'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.balance).toBe(100);
      
      // Check user balance updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.walletBalance).toBe(100);
      
      // Check transaction status
      const updatedTransaction = await Transaction.findById(transaction._id);
      expect(updatedTransaction.status).toBe('completed');
    });

    it('should fail for invalid transaction', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .post('/api/wallet/verify-payment')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: 'invalid_order',
          paymentId: 'pay_test123',
          signature: 'test_signature'
        });
      
      expect(res.status).toBe(400);
    });
  });
});

describe('Wallet Balance Operations', () => {
  it('should correctly track balance after multiple transactions', async () => {
    const { user, token } = await setupAuthenticatedUser({ walletBalance: 1000 });
    
    // Create multiple transactions
    await createTestTransaction(user._id, {
      type: 'debit',
      category: 'match_entry',
      amount: 100,
      balanceBefore: 1000,
      balanceAfter: 900
    });
    
    await createTestTransaction(user._id, {
      type: 'credit',
      category: 'match_prize',
      amount: 250,
      balanceBefore: 900,
      balanceAfter: 1150
    });
    
    const res = await request(app)
      .get('/api/wallet/transactions')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.transactions.length).toBe(2);
  });
});
