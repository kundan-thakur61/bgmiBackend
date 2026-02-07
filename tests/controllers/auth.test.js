const request = require('supertest');
const app = require('../app');
const { User } = require('../../models');
const {
  createTestUser,
  createUserWithOTP,
  generateAuthToken,
  setupAuthenticatedUser,
  generatePhoneNumber
} = require('../helpers');

describe('Auth Controller', () => {
  
  describe('POST /api/auth/send-otp', () => {
    it('should send OTP for new user', async () => {
      const phone = generatePhoneNumber();
      
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('OTP sent successfully');
      
      // Check user was created
      const user = await User.findOne({ phone });
      expect(user).toBeTruthy();
      expect(user.otp.code).toBeDefined();
    });

    it('should send OTP for existing user', async () => {
      const existingUser = await createTestUser();
      
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: existingUser.phone });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail with invalid phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({ phone: '12345' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail without phone number', async () => {
      const res = await request(app)
        .post('/api/auth/send-otp')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('should verify OTP and return token', async () => {
      const phone = generatePhoneNumber();
      const { user, otp } = await createUserWithOTP(phone);
      user.name = 'Test User';
      await user.save();
      
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });

    it('should indicate registration needed for new users', async () => {
      const phone = generatePhoneNumber();
      const { otp } = await createUserWithOTP(phone);
      
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp });
      
      expect(res.status).toBe(200);
      expect(res.body.needsRegistration).toBe(true);
    });

    it('should fail with wrong OTP', async () => {
      const phone = generatePhoneNumber();
      await createUserWithOTP(phone);
      
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp: '000000' });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with expired OTP', async () => {
      const phone = generatePhoneNumber();
      const user = await User.create({ phone });
      user.otp = {
        code: '123456',
        expiresAt: new Date(Date.now() - 1000), // Expired
        attempts: 0
      };
      await user.save();
      
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp: '123456' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });

    it('should fail after too many attempts', async () => {
      const phone = generatePhoneNumber();
      const user = await User.create({ phone });
      user.otp = {
        code: '123456',
        expiresAt: new Date(Date.now() + 300000),
        attempts: 3
      };
      await user.save();
      
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp: '123456' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('attempts');
    });

    it('should fail for non-existent phone', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone: '9876543210', otp: '123456' });
      
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const phone = generatePhoneNumber();
      const { otp } = await createUserWithOTP(phone);
      
      // Verify OTP first
      await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp });
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          phone,
          dateOfBirth: '1995-05-15'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('New User');
      expect(res.body.token).toBeDefined();
    });

    it('should apply referral bonus', async () => {
      // Create referrer
      const referrer = await createTestUser({ name: 'Referrer' });
      
      // Create new user with OTP
      const phone = generatePhoneNumber();
      const { otp } = await createUserWithOTP(phone);
      
      // Verify OTP first
      await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp });
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Referred User',
          phone,
          referralCode: referrer.referralCode,
          dateOfBirth: '1995-05-15'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.user.bonusBalance).toBe(10); // Signup bonus
      
      // Check referrer count updated
      const updatedReferrer = await User.findById(referrer._id);
      expect(updatedReferrer.referralCount).toBe(1);
    });

    it('should reject users under 18', async () => {
      const phone = generatePhoneNumber();
      const { otp } = await createUserWithOTP(phone);
      
      await request(app)
        .post('/api/auth/verify-otp')
        .send({ phone, otp });
      
      const today = new Date();
      const underageDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Young User',
          phone,
          dateOfBirth: underageDate.toISOString()
        });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('18');
    });

    it('should fail for already registered user', async () => {
      const user = await createTestUser();
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New Name',
          phone: user.phone,
          dateOfBirth: '1995-05-15'
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user', async () => {
      const { user, token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user._id.toString()).toBe(user._id.toString());
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');
      
      expect(res.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const { token } = await setupAuthenticatedUser();
      
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/verify-referral/:code', () => {
    it('should verify valid referral code', async () => {
      const user = await createTestUser({ name: 'Referrer User' });
      
      const res = await request(app)
        .get(`/api/auth/verify-referral/${user.referralCode}`);
      
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.referrer.name).toBe('Referrer User');
    });

    it('should reject invalid referral code', async () => {
      const res = await request(app)
        .get('/api/auth/verify-referral/INVALID123');
      
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(false);
    });
  });

  describe('GET /api/auth/check-phone/:phone', () => {
    it('should return exists true for registered user', async () => {
      const user = await createTestUser();
      
      const res = await request(app)
        .get(`/api/auth/check-phone/${user.phone}`);
      
      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(true);
      expect(res.body.registered).toBe(true);
    });

    it('should return exists false for new phone', async () => {
      const res = await request(app)
        .get(`/api/auth/check-phone/${generatePhoneNumber()}`);
      
      expect(res.status).toBe(200);
      expect(res.body.exists).toBe(false);
    });
  });
});
