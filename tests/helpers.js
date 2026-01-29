const jwt = require('jsonwebtoken');
const { User, Match, Transaction, Notification } = require('../models');

/**
 * Create a test user with optional overrides
 */
const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
    name: 'Test User',
    isPhoneVerified: true,
    isActive: true,
    walletBalance: 1000,
    bonusBalance: 100,
    level: 'bronze',
    xp: 0,
    role: 'user'
  };

  const userData = { ...defaultUser, ...overrides };
  const user = await User.create(userData);
  return user;
};

/**
 * Create a test admin user
 */
const createTestAdmin = async (overrides = {}) => {
  return createTestUser({
    name: 'Admin User',
    role: 'admin',
    ...overrides
  });
};

/**
 * Create a super admin user
 */
const createTestSuperAdmin = async (overrides = {}) => {
  return createTestUser({
    name: 'Super Admin User',
    role: 'super_admin',
    ...overrides
  });
};

/**
 * Generate auth token for a user
 */
const generateAuthToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Create a test match with optional overrides
 */
const createTestMatch = async (createdBy, overrides = {}) => {
  const defaultMatch = {
    title: 'Test Match',
    gameType: 'pubg_mobile',
    matchType: 'match_win',
    mode: 'solo',
    map: 'erangel',
    entryFee: 50,
    prizePool: 500,
    perKillPrize: 10,
    maxSlots: 100,
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    status: 'registration_open',
    createdBy: createdBy._id,
    prizeDistribution: [
      { position: 1, prize: 250, label: '1st Place' },
      { position: 2, prize: 150, label: '2nd Place' },
      { position: 3, prize: 100, label: '3rd Place' }
    ],
    rules: ['No teaming', 'Fair play only']
  };

  const matchData = { ...defaultMatch, ...overrides };
  const match = await Match.create(matchData);
  return match;
};

/**
 * Create a test transaction
 */
const createTestTransaction = async (userId, overrides = {}) => {
  const defaultTransaction = {
    user: userId,
    type: 'credit',
    category: 'deposit',
    amount: 100,
    balanceBefore: 0,
    balanceAfter: 100,
    description: 'Test transaction',
    status: 'completed'
  };

  const transactionData = { ...defaultTransaction, ...overrides };
  const transaction = await Transaction.create(transactionData);
  return transaction;
};

/**
 * Create multiple test users
 */
const createMultipleUsers = async (count, overrides = {}) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      name: `Test User ${i + 1}`,
      ...overrides
    });
    users.push(user);
  }
  return users;
};

/**
 * Setup user with auth token
 */
const setupAuthenticatedUser = async (overrides = {}) => {
  const user = await createTestUser(overrides);
  const token = generateAuthToken(user);
  return { user, token };
};

/**
 * Setup admin with auth token
 */
const setupAuthenticatedAdmin = async (overrides = {}) => {
  const admin = await createTestAdmin(overrides);
  const token = generateAuthToken(admin);
  return { admin, token };
};

/**
 * Create user with OTP
 */
const createUserWithOTP = async (phone) => {
  const user = await User.create({ phone });
  const otp = user.generateOTP();
  await user.save();
  return { user, otp };
};

/**
 * Make user join a match
 */
const joinUserToMatch = async (user, match) => {
  const slotNumber = match.addUser(user._id, 'TestPlayer', '12345678');
  await match.save();
  
  // Deduct entry fee
  user.walletBalance -= match.entryFee;
  await user.save();
  
  return slotNumber;
};

/**
 * Create a KYC verified user
 */
const createKYCVerifiedUser = async (overrides = {}) => {
  return createTestUser({
    isKycVerified: true,
    kycStatus: 'approved',
    isAgeVerified: true,
    dateOfBirth: new Date('1995-01-01'),
    ...overrides
  });
};

/**
 * Random string generator for unique values
 */
const randomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate valid Indian phone number
 */
const generatePhoneNumber = () => {
  return `9${Math.floor(100000000 + Math.random() * 900000000)}`;
};

module.exports = {
  createTestUser,
  createTestAdmin,
  createTestSuperAdmin,
  generateAuthToken,
  createTestMatch,
  createTestTransaction,
  createMultipleUsers,
  setupAuthenticatedUser,
  setupAuthenticatedAdmin,
  createUserWithOTP,
  joinUserToMatch,
  createKYCVerifiedUser,
  randomString,
  generatePhoneNumber
};
