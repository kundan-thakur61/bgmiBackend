const logger = require('../utils/logger');

// ─── Custom Error Classes ───────────────────────────────────────────────

class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || null;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code
    };
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

class PaymentError extends AppError {
  constructor(message = 'Payment processing failed') {
    super(message, 402, 'PAYMENT_FAILED');
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation error', errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

// ─── Error Handler Middleware ───────────────────────────────────────────

const errorHandler = (err, req, res, next) => {
  // Prevent double response
  if (res.headersSent) {
    return next(err);
  }

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  let errors = err.errors || null;

  // ── Map known error types ───────────────────────────────────

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors && !err.isOperational) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation error';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: process.env.NODE_ENV === 'development' ? e.value : undefined
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path || 'ID'} format`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired. Please login again.';
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    code = 'FILE_UPLOAD_ERROR';
    const multerMessages = {
      'LIMIT_FILE_SIZE': 'File size exceeds the maximum allowed limit',
      'LIMIT_FILE_COUNT': 'Too many files uploaded',
      'LIMIT_UNEXPECTED_FILE': 'Unexpected file field',
      'LIMIT_PART_COUNT': 'Too many parts',
      'LIMIT_FIELD_KEY': 'Field name too long',
      'LIMIT_FIELD_VALUE': 'Field value too long',
      'LIMIT_FIELD_COUNT': 'Too many fields'
    };
    message = multerMessages[err.code] || err.message;
  }

  // Express validator errors
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation error';
    errors = err.array().map(e => ({
      field: e.path,
      message: e.msg
    }));
  }

  // Razorpay / Payment errors
  if (err.message && err.message.includes('Razorpay')) {
    statusCode = 502;
    code = 'PAYMENT_GATEWAY_ERROR';
    message = 'Payment gateway error. Please try again later.';
  }

  // ── Logging ─────────────────────────────────────────────────

  const logMeta = {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    code,
    userId: req.userId?.toString(),
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  if (statusCode >= 500) {
    // 5xx errors: full error logging (these are bugs)
    logger.error(`${message}`, { ...logMeta, error: err });
  } else if (statusCode >= 400) {
    // 4xx errors: warn level (client errors, not bugs)
    logger.warn(`${message}`, logMeta);
  }

  // ── Response ────────────────────────────────────────────────

  const response = {
    success: false,
    message,
    code,
    ...(errors && { errors }),
    ...(req.id && { requestId: req.id }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err.name
    })
  };

  res.status(statusCode).json(response);
};

module.exports = {
  errorHandler,
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  PaymentError,
  ValidationError
};
