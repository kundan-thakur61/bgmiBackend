const { User, Match } = require('../../models');
const { createTestUser, createTestAdmin, createTestMatch } = require('../helpers');

describe('User Model', () => {
  
  describe('Schema Validation', () => {
    it('should create user with valid data', async () => {
      const user = await User.create({
        phone: '9876543210',
        name: 'Test User'
      });
      
      expect(user._id).toBeDefined();
      expect(user.phone).toBe('9876543210');
      expect(user.name).toBe('Test User');
    });

    it('should validate phone number format', async () => {
      await expect(User.create({
        phone: '1234567890', // Invalid - doesn't start with 6-9
        name: 'Test'
      })).rejects.toThrow();
    });

    it('should validate email format', async () => {
      await expect(User.create({
        email: 'invalid-email',
        name: 'Test'
      })).rejects.toThrow();
    });

    it('should enforce unique phone', async () => {
      await User.create({ phone: '9876543210' });
      
      await expect(User.create({
        phone: '9876543210'
      })).rejects.toThrow();
    });

    it('should set default values', async () => {
      const user = await User.create({ phone: '9876543211' });
      
      expect(user.walletBalance).toBe(0);
      expect(user.bonusBalance).toBe(0);
      expect(user.level).toBe('bronze');
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.isBanned).toBe(false);
    });
  });

  describe('Methods', () => {
    it('should generate referral code', async () => {
      const user = await User.create({
        phone: '9876543212',
        name: 'TestUser'
      });
      
      expect(user.referralCode).toBeDefined();
      expect(user.referralCode.length).toBeGreaterThan(0);
    });

    it('should generate and verify OTP', async () => {
      const user = await User.create({ phone: '9876543213' });
      const otp = user.generateOTP();
      
      expect(otp).toBeDefined();
      expect(otp.length).toBe(6);
      expect(user.otp.code).toBe(otp);
      
      const result = user.verifyOTP(otp);
      expect(result.valid).toBe(true);
    });

    it('should reject wrong OTP', async () => {
      const user = await User.create({ phone: '9876543214' });
      user.generateOTP();
      await user.save();
      
      const result = user.verifyOTP('000000');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid OTP');
    });

    it('should reject expired OTP', async () => {
      const user = await User.create({ phone: '9876543215' });
      user.otp = {
        code: '123456',
        expiresAt: new Date(Date.now() - 1000), // Expired
        attempts: 0
      };
      
      const result = user.verifyOTP('123456');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('OTP expired');
    });

    it('should track OTP attempts', async () => {
      const user = await User.create({ phone: '9876543216' });
      user.otp = {
        code: '123456',
        expiresAt: new Date(Date.now() + 300000),
        attempts: 3
      };
      
      const result = user.verifyOTP('123456');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Too many attempts');
    });

    it('should update level based on XP', async () => {
      const user = await User.create({ phone: '9876543217' });
      
      user.xp = 500;
      user.updateLevel();
      expect(user.level).toBe('bronze');
      
      user.xp = 1500;
      user.updateLevel();
      expect(user.level).toBe('silver');
      
      user.xp = 6000;
      user.updateLevel();
      expect(user.level).toBe('gold');
      
      user.xp = 20000;
      user.updateLevel();
      expect(user.level).toBe('platinum');
      
      user.xp = 60000;
      user.updateLevel();
      expect(user.level).toBe('diamond');
    });

    it('should check withdrawal eligibility', async () => {
      const user = await createTestUser({ isKycVerified: false });
      
      const result = user.canWithdraw();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('KYC');
    });

    it('should allow withdrawal for KYC verified user', async () => {
      const user = await createTestUser({ isKycVerified: true });
      
      const result = user.canWithdraw();
      expect(result.allowed).toBe(true);
    });

    it('should block withdrawal for banned user', async () => {
      const user = await createTestUser({ isBanned: true, isKycVerified: true });
      
      const result = user.canWithdraw();
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('banned');
    });
  });

  describe('Indexes', () => {
    it('should have phone as unique index', async () => {
      const user1 = await User.create({ phone: '9876543218' });
      
      await expect(User.create({ phone: '9876543218' })).rejects.toThrow();
    });

    it('should allow multiple users without email (sparse index)', async () => {
      await User.create({ phone: '9876543219' });
      await User.create({ phone: '9876543220' });
      
      const count = await User.countDocuments();
      expect(count).toBe(2);
    });
  });
});

describe('Match Model', () => {
  let admin;

  beforeEach(async () => {
    admin = await createTestAdmin();
  });

  describe('Schema Validation', () => {
    it('should create match with valid data', async () => {
      const match = await createTestMatch(admin);
      
      expect(match._id).toBeDefined();
      expect(match.title).toBe('Test Match');
      expect(match.gameType).toBe('pubg_mobile');
    });

    it('should set default values', async () => {
      const match = await createTestMatch(admin);
      
      expect(match.filledSlots).toBe(0);
      expect(match.status).toBe('registration_open');
      expect(match.roomCredentialsVisible).toBe(false);
    });
  });

  describe('Methods', () => {
    it('should add user to match', async () => {
      const match = await createTestMatch(admin);
      const user = await createTestUser({ walletBalance: 1000 });
      
      const slotNumber = match.addUser(user._id, 'PlayerName', '12345678');
      
      expect(slotNumber).toBe(1);
      expect(match.filledSlots).toBe(1);
      expect(match.joinedUsers.length).toBe(1);
    });

    it('should check if user has joined', async () => {
      const match = await createTestMatch(admin);
      const user = await createTestUser({ walletBalance: 1000 });
      
      expect(match.hasUserJoined(user._id)).toBe(false);
      
      match.addUser(user._id, 'PlayerName', '12345678');
      
      expect(match.hasUserJoined(user._id)).toBe(true);
    });

    it('should remove user from match', async () => {
      const match = await createTestMatch(admin);
      const user = await createTestUser({ walletBalance: 1000 });
      
      match.addUser(user._id, 'PlayerName', '12345678');
      expect(match.filledSlots).toBe(1);
      
      match.removeUser(user._id);
      
      expect(match.filledSlots).toBe(0);
      expect(match.hasUserJoined(user._id)).toBe(false);
    });

    it('should get user slot', async () => {
      const match = await createTestMatch(admin);
      const user = await createTestUser({ walletBalance: 1000 });
      
      match.addUser(user._id, 'PlayerName', '12345678');
      await match.save();
      
      const slot = match.getUserSlot(user._id);
      
      expect(slot).toBeDefined();
      expect(slot.inGameName).toBe('PlayerName');
    });

    it('should check if match is joinable', async () => {
      const match = await createTestMatch(admin, { status: 'registration_open' });
      
      const result = match.isJoinable();
      expect(result.joinable).toBe(true);
    });

    it('should reject joining full match', async () => {
      const match = await createTestMatch(admin, { maxSlots: 2 });
      const user1 = await createTestUser({ walletBalance: 1000 });
      const user2 = await createTestUser({ walletBalance: 1000 });
      
      match.addUser(user1._id, 'Player1', '11111111');
      match.addUser(user2._id, 'Player2', '22222222');
      await match.save();
      
      const result = match.isJoinable();
      expect(result.joinable).toBe(false);
      expect(result.reason).toContain('full');
    });

    it('should reject joining non-open match', async () => {
      const match = await createTestMatch(admin, { status: 'live' });
      
      const result = match.isJoinable();
      expect(result.joinable).toBe(false);
    });
  });
});
