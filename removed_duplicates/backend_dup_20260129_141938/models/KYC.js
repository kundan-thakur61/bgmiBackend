const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Personal Details
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  // Address
  address: {
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { 
      type: String, 
      required: true,
      match: [/^\d{6}$/, 'Invalid pincode']
    },
    country: { type: String, default: 'India' }
  },
  // Identity Documents
  documentType: {
    type: String,
    required: [true, 'Document type is required'],
    enum: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'passport']
  },
  documentNumber: {
    type: String,
    required: [true, 'Document number is required']
  },
  // Masked document number for display
  maskedDocumentNumber: String,
  // Document Images (stored securely)
  documentFront: {
    url: String,
    publicId: String,
    uploadedAt: Date
  },
  documentBack: {
    url: String,
    publicId: String,
    uploadedAt: Date
  },
  selfie: {
    url: String,
    publicId: String,
    uploadedAt: Date
  },
  // PAN specific (required for tax compliance)
  panNumber: {
    type: String,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number']
  },
  maskedPanNumber: String,
  panDocument: {
    url: String,
    publicId: String,
    uploadedAt: Date
  },
  // Aadhaar specific
  aadhaarNumber: {
    type: String,
    match: [/^\d{12}$/, 'Invalid Aadhaar number']
  },
  maskedAadhaarNumber: String,
  // Verification Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'resubmission_required'],
    default: 'pending',
    index: true
  },
  // Verification Details
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  verificationNotes: String,
  // Rejection
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,
  rejectionDetails: String,
  // Resubmission
  resubmissionCount: {
    type: Number,
    default: 0
  },
  lastResubmittedAt: Date,
  // Auto-verification (if using third-party service)
  autoVerificationResult: {
    service: String, // e.g., 'digio', 'hyperverge'
    transactionId: String,
    result: mongoose.Schema.Types.Mixed,
    verifiedAt: Date
  },
  // Age verification
  isAdult: {
    type: Boolean,
    default: false
  },
  // Submission metadata
  submittedFromIp: String,
  submittedFromDevice: String
}, {
  timestamps: true
});

// Indexes
kycSchema.index({ status: 1, createdAt: 1 });
kycSchema.index({ user: 1, status: 1 });

// Pre-save: Mask sensitive numbers and verify age
kycSchema.pre('save', function(next) {
  // Mask Aadhaar number
  if (this.isModified('aadhaarNumber') && this.aadhaarNumber) {
    this.maskedAadhaarNumber = 'XXXX XXXX ' + this.aadhaarNumber.slice(-4);
  }
  
  // Mask PAN number
  if (this.isModified('panNumber') && this.panNumber) {
    this.maskedPanNumber = this.panNumber.slice(0, 2) + 'XXXXX' + this.panNumber.slice(-3);
  }
  
  // Mask document number
  if (this.isModified('documentNumber') && this.documentNumber) {
    const len = this.documentNumber.length;
    if (len > 4) {
      this.maskedDocumentNumber = 'X'.repeat(len - 4) + this.documentNumber.slice(-4);
    }
  }
  
  // Verify age (must be 18+)
  if (this.isModified('dateOfBirth') && this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    this.isAdult = age >= 18;
  }
  
  next();
});

// Approve KYC
kycSchema.methods.approve = async function(adminId, notes = '') {
  const User = mongoose.model('User');
  
  this.status = 'approved';
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  
  await this.save();
  
  // Update user's KYC status
  await User.findByIdAndUpdate(this.user, {
    isKycVerified: true,
    kycStatus: 'approved',
    isAgeVerified: this.isAdult,
    dateOfBirth: this.dateOfBirth
  });
  
  return this;
};

// Reject KYC
kycSchema.methods.reject = async function(adminId, reason, details = '') {
  const User = mongoose.model('User');
  
  this.status = 'rejected';
  this.rejectedBy = adminId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.rejectionDetails = details;
  
  await this.save();
  
  // Update user's KYC status
  await User.findByIdAndUpdate(this.user, {
    isKycVerified: false,
    kycStatus: 'rejected'
  });
  
  return this;
};

// Request resubmission
kycSchema.methods.requestResubmission = async function(adminId, reason, details = '') {
  const User = mongoose.model('User');
  
  this.status = 'resubmission_required';
  this.rejectedBy = adminId;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  this.rejectionDetails = details;
  
  await this.save();
  
  // Update user's KYC status
  await User.findByIdAndUpdate(this.user, {
    kycStatus: 'rejected'
  });
  
  return this;
};

// Resubmit KYC
kycSchema.methods.resubmit = async function(data) {
  Object.assign(this, data);
  this.status = 'pending';
  this.resubmissionCount += 1;
  this.lastResubmittedAt = new Date();
  this.rejectionReason = undefined;
  this.rejectionDetails = undefined;
  
  await this.save();
  
  return this;
};

module.exports = mongoose.model('KYC', kycSchema);
