const { body, param, query, validationResult } = require('express-validator');

// Check validation result
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(e => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
};

// Common validators
const validators = {
  // Auth validators
  phone: body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit Indian mobile number'),
  
  otp: body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  
  email: body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  // Match validators
  matchId: param('id')
    .isMongoId()
    .withMessage('Invalid match ID'),
  
  entryFee: body('entryFee')
    .isNumeric()
    .withMessage('Entry fee must be a number')
    .custom(value => value >= 0)
    .withMessage('Entry fee cannot be negative'),
  
  prizePool: body('prizePool')
    .isNumeric()
    .withMessage('Prize pool must be a number')
    .custom(value => value >= 0)
    .withMessage('Prize pool cannot be negative'),
  
  maxSlots: body('maxSlots')
    .isInt({ min: 2, max: 100 })
    .withMessage('Max slots must be between 2 and 100'),
  
  gameType: body('gameType')
    .isIn(['pubg_mobile', 'free_fire'])
    .withMessage('Invalid game type'),
  
  matchType: body('matchType')
    .isIn(['match_win', 'tournament', 'tdm', 'wow', 'special'])
    .withMessage('Invalid match type'),
  
  mode: body('mode')
    .isIn(['solo', 'duo', 'squad'])
    .withMessage('Invalid mode'),
  
  // Wallet validators
  amount: body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => value > 0)
    .withMessage('Amount must be greater than 0'),
  
  withdrawalAmount: body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom(value => value >= 100)
    .withMessage('Minimum withdrawal amount is ₹100'),
  
  upiId: body('upiId')
    .matches(/^[\w.-]+@[\w.-]+$/)
    .withMessage('Please enter a valid UPI ID'),
  
  // KYC validators
  aadhaar: body('aadhaarNumber')
    .matches(/^\d{12}$/)
    .withMessage('Aadhaar number must be 12 digits'),
  
  pan: body('panNumber')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('Please enter a valid PAN number'),
  
  pincode: body('address.pincode')
    .matches(/^\d{6}$/)
    .withMessage('Please enter a valid 6-digit pincode'),
  
  // Pagination
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  // Date
  date: body('date')
    .isISO8601()
    .withMessage('Please enter a valid date'),
  
  scheduledAt: body('scheduledAt')
    .isISO8601()
    .withMessage('Please enter a valid scheduled date')
    .custom(value => new Date(value) > new Date())
    .withMessage('Scheduled date must be in the future'),
  
  // Generic ID
  mongoId: (field) => param(field)
    .isMongoId()
    .withMessage(`Invalid ${field}`),
  
  // In-game details
  inGameId: body('inGameId')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('In-game ID must be between 5 and 20 characters'),
  
  inGameName: body('inGameName')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('In-game name must be between 2 and 30 characters')
};

// Validation chains for different endpoints
const validationChains = {
  sendOtp: [validators.phone, validate],
  
  verifyOtp: [validators.phone, validators.otp, validate],
  
  register: [
    validators.name,
    validators.phone,
    body('referralCode').optional().trim(),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Invalid date of birth'),
    validate
  ],
  
  createMatch: [
    body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    validators.gameType,
    validators.matchType,
    validators.mode,
    validators.entryFee,
    validators.prizePool,
    validators.maxSlots,
    validators.scheduledAt,
    validate
  ],
  
  joinMatch: [
    validators.matchId,
    validators.inGameId,
    validators.inGameName,
    validate
  ],
  
  createWithdrawal: [
    validators.withdrawalAmount,
    body('method').isIn(['upi', 'bank']).withMessage('Invalid withdrawal method'),
    body('upiId').if(body('method').equals('upi')).matches(/^[\w.-]+@[\w.-]+$/),
    validate
  ],
  
  submitKyc: [
    validators.name,
    body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
    body('documentType').isIn(['aadhaar', 'pan', 'voter_id', 'driving_license', 'passport']),
    body('documentNumber').trim().notEmpty().withMessage('Document number is required'),
    body('address.line1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('address.city').trim().notEmpty().withMessage('City is required'),
    body('address.state').trim().notEmpty().withMessage('State is required'),
    validators.pincode,
    validate
  ],
  
  createTicket: [
    body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
    body('category').isIn(['payment', 'withdrawal', 'match', 'tournament', 'account', 'technical', 'report_user', 'other']),
    body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be between 10 and 2000 characters'),
    validate
  ],
  
  pagination: [
    validators.page,
    validators.limit,
    validate
  ]
};

module.exports = {
  validate,
  validators,
  validationChains
};
