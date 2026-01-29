const { User, Transaction, Notification } = require('../models');
const { generateToken } = require('../middleware/auth');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');
const { sendOTP } = require('../config/sms');

// Send OTP
exports.sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    // Find or create user
    let user = await User.findOne({ phone });

    if (!user) {
      // Create temporary user (will be completed during registration)
      user = new User({ phone });
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP via SMS
    const smsResult = await sendOTP(phone, otp);

    // In development, return OTP (remove in production)
    const isDev = process.env.NODE_ENV === 'development';

    console.log(`📱 OTP for ${phone}: ${otp}`); // Dev only

    res.json({
      success: true,
      message: smsResult.success ? 'OTP sent successfully' : 'OTP generated (SMS delivery failed)',
      smsSent: smsResult.success,
      ...(isDev && { otp }) // Only in development
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP
exports.verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isBanned) {
      throw new ForbiddenError(user.banReason || 'Your account has been banned');
    }
    if (!user.isActive) {
      throw new ForbiddenError('Your account is inactive');
    }

    const verifyResult = user.verifyOTP(otp);

    if (!verifyResult.valid) {
      await user.save();
      throw new BadRequestError(verifyResult.message);
    }

    user.isPhoneVerified = true;
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;

    // Track device fingerprint
    const fingerprint = req.headers['x-device-fingerprint'];
    if (fingerprint) {
      const existingDevice = user.deviceFingerprints.find(d => d.fingerprint === fingerprint);
      if (existingDevice) {
        existingDevice.lastUsed = new Date();
        existingDevice.ip = req.ip;
      } else {
        user.deviceFingerprints.push({
          fingerprint,
          userAgent: req.headers['user-agent'],
          ip: req.ip
        });
      }
    }

    await user.save();

    const needsRegistration = !user.name;
    const token = needsRegistration ? null : generateToken(user);

    const response = {
      success: true,
      message: 'OTP verified successfully',
      needsRegistration
    };

    if (!needsRegistration) {
      response.token = token;
      response.user = {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        walletBalance: user.walletBalance,
        level: user.level,
        isKycVerified: user.isKycVerified,
        role: user.role,
        avatar: user.avatar
      };
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { name, phone, referralCode, dateOfBirth } = req.body;

    const user = await User.findOne({ phone });

    if (!user) {
      throw new NotFoundError('Please verify your phone first');
    }

    if (user.name) {
      throw new BadRequestError('User already registered');
    }

    user.name = name;

    // Verify age (18+)
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        throw new BadRequestError('You must be 18 or older to register');
      }

      user.dateOfBirth = birthDate;
      user.isAgeVerified = true;
    }

    // Handle referral
    if (referralCode) {
      const referrer = await User.findOne({
        referralCode: referralCode.toUpperCase(),
        _id: { $ne: user._id }
      });

      if (referrer) {
        user.referredBy = referrer._id;

        // Give signup bonus to new user
        const signupBonus = 10; // ₹10 signup bonus
        user.bonusBalance = signupBonus;

        // Update referrer stats
        referrer.referralCount += 1;
        await referrer.save();

        // Create notification for referrer
        await Notification.createAndPush({
          user: referrer._id,
          type: 'referral_bonus',
          title: 'New Referral!',
          message: `${name} joined using your referral code. You'll earn commission on their match fees!`,
          priority: 'normal'
        });
      }
    }

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        walletBalance: user.walletBalance,
        bonusBalance: user.bonusBalance,
        referralCode: user.referralCode,
        level: user.level,
        isKycVerified: user.isKycVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth - Initiate
exports.googleAuth = (req, res) => {
  // Determine callback URL based on environment
  let callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  const host = req.get('host');

  // Smart detection: If we are on Render (production), force the correct callback URL
  // This fixes the issue where NODE_ENV might not be 'production' or GOOGLE_CALLBACK_URL is missing
  if (host && host.includes('onrender.com')) {
    callbackUrl = `https://${host}/api/auth/google/callback`;
  } else if (process.env.NODE_ENV === 'production') {
    if (!callbackUrl || callbackUrl.includes('localhost')) {
      callbackUrl = 'https://bgmibackend-5gu6.onrender.com/api/auth/google/callback';
    }
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${callbackUrl}&` +
    `response_type=code&` +
    `scope=profile email&` +
    `access_type=offline`;

  res.redirect(googleAuthUrl);
};

// Google OAuth - Callback
exports.googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;

    // Determine callback URL (must match the one used in googleAuth)
    let callbackUrl = process.env.GOOGLE_CALLBACK_URL;
    const host = req.get('host');

    // Same smart detection as above
    if (host && host.includes('onrender.com')) {
      callbackUrl = `https://${host}/api/auth/google/callback`;
    } else if (process.env.NODE_ENV === 'production') {
      if (!callbackUrl || callbackUrl.includes('localhost')) {
        callbackUrl = 'https://bgmibackend-5gu6.onrender.com/api/auth/google/callback';
      }
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const googleUser = await userInfoResponse.json();

    // Find or create user
    let user = await User.findOne({ googleId: googleUser.id });

    if (!user) {
      // Check if email already exists
      user = await User.findOne({ email: googleUser.email });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleUser.id;
        if (!user.avatar?.url) {
          user.avatar = { url: googleUser.picture };
        }
      } else {
        // Create new user
        user = new User({
          googleId: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          avatar: { url: googleUser.picture },
          isEmailVerified: true
        });
      }
    }

    if (user.isBanned) {
      throw new ForbiddenError(user.banReason || 'Your account has been banned');
    }
    if (!user.isActive) {
      throw new ForbiddenError('Your account is inactive');
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save();

    const token = generateToken(user);

    // Redirect to frontend with token
    let frontendUrl = process.env.FRONTEND_URL;

    // Smart detection for frontend URL as well
    if (host && host.includes('onrender.com')) {
      // If backend is on Render, and frontend URL is missing or localhost, default to Vercel
      if (!frontendUrl || frontendUrl.includes('localhost')) {
        frontendUrl = 'https://bgmifrontendcod.vercel.app';
      }
    } else if (process.env.NODE_ENV === 'production') {
      if (!frontendUrl || frontendUrl.includes('localhost')) {
        frontendUrl = 'https://bgmifrontendcod.vercel.app';
      }
    } else {
      frontendUrl = frontendUrl || 'http://localhost:3000';
    }

    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
};

// Refresh token
exports.refreshToken = async (req, res, next) => {
  try {
    const token = generateToken(req.user);

    res.json({
      success: true,
      token
    });
  } catch (error) {
    next(error);
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    // In a more complete implementation, you would blacklist the token
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
      .select('-otp -deviceFingerprints');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Verify referral code
exports.verifyReferralCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const user = await User.findOne({
      referralCode: code.toUpperCase()
    }).select('name referralCode');

    if (!user) {
      return res.json({
        success: false,
        valid: false,
        message: 'Invalid referral code'
      });
    }

    res.json({
      success: true,
      valid: true,
      referrer: {
        name: user.name,
        code: user.referralCode
      }
    });
  } catch (error) {
    next(error);
  }
};

// Check if phone exists
exports.checkPhone = async (req, res, next) => {
  try {
    const { phone } = req.params;

    const user = await User.findOne({ phone }).select('name');

    res.json({
      success: true,
      exists: !!user,
      registered: user ? !!user.name : false
    });
  } catch (error) {
    next(error);
  }
};
