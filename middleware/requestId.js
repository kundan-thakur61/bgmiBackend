/**
 * Request ID middleware
 * Attaches a unique request ID to every request for tracing and correlation
 */
const crypto = require('crypto');

const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};

module.exports = { requestId };
