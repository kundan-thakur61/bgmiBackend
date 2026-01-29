const { KYC, User, Notification, AdminLog } = require('../models');
const { uploadImage } = require('../config/cloudinary');
const { BadRequestError, NotFoundError } = require('../middleware/errorHandler');

// Get KYC status
exports.getKycStatus = async (req, res, next) => {
  try {
    const kyc = await KYC.findOne({ user: req.userId }).select('-documentNumber -aadhaarNumber -panNumber');
    const user = await User.findById(req.userId).select('isKycVerified kycStatus');
    
    res.json({
      success: true,
      kycStatus: user.kycStatus,
      isVerified: user.isKycVerified,
      kyc: kyc ? {
        status: kyc.status,
        fullName: kyc.fullName,
        maskedDocumentNumber: kyc.maskedDocumentNumber,
        maskedAadhaarNumber: kyc.maskedAadhaarNumber,
        maskedPanNumber: kyc.maskedPanNumber,
        rejectionReason: kyc.rejectionReason,
        submittedAt: kyc.createdAt
      } : null
    });
  } catch (error) {
    next(error);
  }
};

// Submit KYC
exports.submitKyc = async (req, res, next) => {
  try {
    const existingKyc = await KYC.findOne({ user: req.userId });
    
    if (existingKyc && ['pending', 'approved', 'under_review'].includes(existingKyc.status)) {
      throw new BadRequestError('KYC already submitted');
    }
    
    const { fullName, dateOfBirth, gender, address, documentType, documentNumber, aadhaarNumber, panNumber } = req.body;
    
    // Verify age
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    
    if (age < 18) {
      throw new BadRequestError('You must be at least 18 years old');
    }
    
    // Upload documents
    const documents = {};
    
    if (req.files.documentFront) {
      const front = req.files.documentFront[0];
      const result = await uploadImage(`data:${front.mimetype};base64,${front.buffer.toString('base64')}`, 'battlezone/kyc');
      documents.documentFront = { url: result.url, publicId: result.publicId, uploadedAt: new Date() };
    }
    
    if (req.files.documentBack) {
      const back = req.files.documentBack[0];
      const result = await uploadImage(`data:${back.mimetype};base64,${back.buffer.toString('base64')}`, 'battlezone/kyc');
      documents.documentBack = { url: result.url, publicId: result.publicId, uploadedAt: new Date() };
    }
    
    if (req.files.selfie) {
      const selfie = req.files.selfie[0];
      const result = await uploadImage(`data:${selfie.mimetype};base64,${selfie.buffer.toString('base64')}`, 'battlezone/kyc');
      documents.selfie = { url: result.url, publicId: result.publicId, uploadedAt: new Date() };
    }
    
    if (req.files.panDocument) {
      const pan = req.files.panDocument[0];
      const result = await uploadImage(`data:${pan.mimetype};base64,${pan.buffer.toString('base64')}`, 'battlezone/kyc');
      documents.panDocument = { url: result.url, publicId: result.publicId, uploadedAt: new Date() };
    }
    
    // Parse address - handle both string and object
    let parsedAddress = address;
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch (e) {
        parsedAddress = { line1: address };
      }
    }

    const kycData = {
      user: req.userId,
      fullName,
      dateOfBirth,
      gender,
      address: parsedAddress,
      documentType,
      documentNumber,
      aadhaarNumber,
      panNumber,
      ...documents,
      status: 'pending',
      submittedFromIp: req.ip,
      submittedFromDevice: req.headers['user-agent']
    };
    
    let kyc;
    if (existingKyc) {
      Object.assign(existingKyc, kycData);
      existingKyc.resubmissionCount += 1;
      kyc = await existingKyc.save();
    } else {
      kyc = await KYC.create(kycData);
    }
    
    await User.findByIdAndUpdate(req.userId, { kycStatus: 'pending' });
    
    res.status(201).json({
      success: true,
      message: 'KYC submitted successfully. Verification usually takes 24-48 hours.',
      kyc: { id: kyc._id, status: kyc.status }
    });
  } catch (error) {
    next(error);
  }
};

// Resubmit KYC
exports.resubmitKyc = async (req, res, next) => {
  try {
    const kyc = await KYC.findOne({ user: req.userId });
    
    if (!kyc) throw new NotFoundError('KYC not found');
    if (kyc.status !== 'resubmission_required' && kyc.status !== 'rejected') {
      throw new BadRequestError('KYC resubmission not required');
    }
    
    const updates = req.body;
    
    // Handle file uploads
    if (req.files.documentFront) {
      const front = req.files.documentFront[0];
      const result = await uploadImage(`data:${front.mimetype};base64,${front.buffer.toString('base64')}`, 'battlezone/kyc');
      updates.documentFront = { url: result.url, publicId: result.publicId, uploadedAt: new Date() };
    }
    
    if (req.files.documentBack) {
      const back = req.files.documentBack[0];
      const result = await uploadImage(`data:${back.mimetype};base64,${back.buffer.toString('base64')}`, 'battlezone/kyc');
      updates.documentBack = { url: result.url, publicId: result.publicId, uploadedAt: new Date() };
    }
    
    if (req.files.selfie) {
      const selfie = req.files.selfie[0];
      const result = await uploadImage(`data:${selfie.mimetype};base64,${selfie.buffer.toString('base64')}`, 'battlezone/kyc');
      updates.selfie = { url: result.url, publicId: result.publicId, uploadedAt: new Date() };
    }
    
    await kyc.resubmit(updates);
    await User.findByIdAndUpdate(req.userId, { kycStatus: 'pending' });
    
    res.json({
      success: true,
      message: 'KYC resubmitted successfully',
      kyc: { id: kyc._id, status: kyc.status }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get pending KYC
exports.getPendingKyc = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'pending' } = req.query;
    
    const kycs = await KYC.find({ status })
      .populate('user', 'name phone email')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await KYC.countDocuments({ status });
    
    res.json({
      success: true,
      kycs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get KYC details
exports.getKycDetails = async (req, res, next) => {
  try {
    const kyc = await KYC.findById(req.params.id).populate('user', 'name phone email walletBalance matchesPlayed');
    if (!kyc) throw new NotFoundError('KYC not found');
    res.json({ success: true, kyc });
  } catch (error) {
    next(error);
  }
};

// Admin: Approve KYC
exports.approveKyc = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const kyc = await KYC.findById(req.params.id);
    if (!kyc) throw new NotFoundError('KYC not found');
    
    await kyc.approve(req.userId, notes);
    
    await Notification.createAndPush({
      user: kyc.user,
      type: 'kyc_approved',
      title: 'KYC Approved!',
      message: 'Your KYC verification has been approved. You can now withdraw funds.',
      reference: { type: 'kyc', id: kyc._id },
      priority: 'high'
    });
    
    await AdminLog.log({
      admin: req.userId,
      action: 'kyc_approve',
      targetType: 'kyc',
      targetId: kyc._id,
      description: `Approved KYC for user`,
      ip: req.ip
    });
    
    res.json({ success: true, message: 'KYC approved' });
  } catch (error) {
    next(error);
  }
};

// Admin: Reject KYC
exports.rejectKyc = async (req, res, next) => {
  try {
    const { reason, details, requireResubmission } = req.body;
    if (!reason) throw new BadRequestError('Rejection reason is required');
    
    const kyc = await KYC.findById(req.params.id);
    if (!kyc) throw new NotFoundError('KYC not found');
    
    if (requireResubmission) {
      await kyc.requestResubmission(req.userId, reason, details);
    } else {
      await kyc.reject(req.userId, reason, details);
    }
    
    await Notification.createAndPush({
      user: kyc.user,
      type: 'kyc_rejected',
      title: 'KYC Verification Update',
      message: requireResubmission ? `Please resubmit your KYC documents. Reason: ${reason}` : `Your KYC was rejected. Reason: ${reason}`,
      reference: { type: 'kyc', id: kyc._id }
    });
    
    await AdminLog.log({
      admin: req.userId,
      action: 'kyc_reject',
      targetType: 'kyc',
      targetId: kyc._id,
      description: `Rejected KYC: ${reason}`,
      ip: req.ip
    });
    
    res.json({ success: true, message: requireResubmission ? 'Resubmission requested' : 'KYC rejected' });
  } catch (error) {
    next(error);
  }
};
