const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number']
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    url: String,
    publicId: String
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: [0, 'Wallet balance cannot be negative']
  },
  bonusBalance: {
    type: Number,
    default: 0,
    min: [0, 'Bonus balance cannot be negative']
  },
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralEarnings: {
    type: Number,
    default: 0
  },
  referralCount: {
    type: Number,
    default: 0
  },
  // User Level System
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  xp: {
    type: Number,
    default: 0
  },
  matchesPlayed: {
    type: Number,
    default: 0
  },
  matchesWon: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  // KYC & Verification
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isKycVerified: {
    type: Boolean,
    default: false
  },
  kycStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'approved', 'rejected'],
    default: 'not_submitted'
  },
  isAgeVerified: {
    type: Boolean,
    default: false
  },
  dateOfBirth: Date,
  // Account Status
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  bannedAt: Date,
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Security & Device Tracking
  deviceFingerprints: [{
    fingerprint: String,
    userAgent: String,
    ip: String,
    lastUsed: { type: Date, default: Date.now }
  }],
  lastLoginAt: Date,
  lastLoginIp: String,
  // Admin Role
  role: {
    type: String,
    enum: ['user', 'host', 'match_manager', 'finance_manager', 'support', 'admin', 'super_admin'],
    default: 'user'
  },
  // Host specific fields
  isVerifiedHost: {
    type: Boolean,
    default: false
  },
  hostRevenueShare: {
    type: Number,
    default: 0 // Percentage
  },
  // OTP
  otp: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },
  // Push Notifications
  pushSubscription: {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    }
  },
  notificationPreferences: {
    matchReminders: { type: Boolean, default: true },
    roomCredentials: { type: Boolean, default: true },
    withdrawalUpdates: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true }
  },
  // Game IDs
  gameProfiles: {
    pubgMobile: {
      inGameId: String,
      inGameName: String
    },
    freeFire: {
      inGameId: String,
      inGameName: String
    }
  }
}, {
  timestamps: true
});

// Indexes (phone, email, referralCode already indexed via unique: true)
userSchema.index({ isBanned: 1, isActive: 1 });
userSchema.index({ role: 1 });
userSchema.index({ level: 1, xp: -1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Generate referral code if not exists
  if (!this.referralCode) {
    this.referralCode = this.generateReferralCode();
  }
  
  // Hash password if modified
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  // Update level based on XP
  this.updateLevel();
  
  next();
});

// Generate unique referral code
userSchema.methods.generateReferralCode = function() {
  const prefix = this.name ? this.name.substring(0, 3).toUpperCase() : 'BZ';
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${random}`;
};

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update user level based on XP
userSchema.methods.updateLevel = function() {
  const levels = {
    bronze: 0,
    silver: 1000,
    gold: 5000,
    platinum: 15000,
    diamond: 50000
  };
  
  if (this.xp >= levels.diamond) this.level = 'diamond';
  else if (this.xp >= levels.platinum) this.level = 'platinum';
  else if (this.xp >= levels.gold) this.level = 'gold';
  else if (this.xp >= levels.silver) this.level = 'silver';
  else this.level = 'bronze';
};

// Add XP
userSchema.methods.addXP = function(amount) {
  this.xp += amount;
  this.updateLevel();
};

// Generate OTP
userSchema.methods.generateOTP = function() {
  const otp = crypto.randomInt(100000, 999999).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    attempts: 0
  };
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(code) {
  if (!this.otp || !this.otp.code) return { valid: false, message: 'OTP not found' };
  if (this.otp.attempts >= 3) return { valid: false, message: 'Too many attempts' };
  if (new Date() > this.otp.expiresAt) return { valid: false, message: 'OTP expired' };
  
  this.otp.attempts += 1;
  
  if (this.otp.code !== code) return { valid: false, message: 'Invalid OTP' };
  
  // Clear OTP after successful verification
  this.otp = undefined;
  return { valid: true };
};

// Check if user can withdraw
userSchema.methods.canWithdraw = function() {
  if (this.isBanned) return { allowed: false, reason: 'Account is banned' };
  if (!this.isKycVerified) return { allowed: false, reason: 'KYC verification required' };
  return { allowed: true };
};

module.exports = mongoose.model('User', userSchema);
