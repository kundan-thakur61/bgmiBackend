const errorHandler = (err, req, res, next) => {
  // Only log errors in non-test environment
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err);
  }

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Multer errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    } else {
      message = err.message;
    }
  }

  // Express validator errors
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    message = 'Validation error';
    errors = err.array().map(e => ({
      field: e.path,
      message: e.msg
    }));
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found error
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

// Unauthorized error
class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

// Forbidden error
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

// Bad request error
class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

module.exports = {
  errorHandler,
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError
};
