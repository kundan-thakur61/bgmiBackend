const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Verify JWT token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned.',
        reason: user.banReason
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive.'
      });
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    next(error);
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && !user.isBanned && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

// Admin only
const adminOnly = authorize('admin', 'super_admin');

// Finance manager and above
const financeAccess = authorize('finance_manager', 'admin', 'super_admin');

// Match manager and above
const matchManagerAccess = authorize('match_manager', 'admin', 'super_admin');

// Support staff and above
const supportAccess = authorize('support', 'match_manager', 'finance_manager', 'admin', 'super_admin');

// Verified host
const hostOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (req.user.role !== 'host' && !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Host access required.'
    });
  }
  
  if (req.user.role === 'host' && !req.user.isVerifiedHost) {
    return res.status(403).json({
      success: false,
      message: 'Your host account is not verified yet.'
    });
  }
  
  next();
};

// KYC verified only
const kycVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (!req.user.isKycVerified) {
    return res.status(403).json({
      success: false,
      message: 'KYC verification required for this action.'
    });
  }
  
  next();
};

// Age verified (18+)
const ageVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (!req.user.isAgeVerified) {
    return res.status(403).json({
      success: false,
      message: 'Age verification required. You must be 18+ to participate.'
    });
  }
  
  next();
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = {
  auth,
  optionalAuth,
  authorize,
  adminOnly,
  financeAccess,
  matchManagerAccess,
  supportAccess,
  hostOnly,
  kycVerified,
  ageVerified,
  generateToken
};
