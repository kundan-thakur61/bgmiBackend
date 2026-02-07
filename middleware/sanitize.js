/**
 * Request sanitization middleware
 * Protects against NoSQL injection and XSS attacks
 */

/**
 * Recursively sanitize an object by removing keys starting with $ and containing .
 * This prevents MongoDB operator injection attacks
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block MongoDB operators (keys starting with $)
    if (key.startsWith('$')) continue;
    // Block dot notation injection
    if (key.includes('.')) continue;

    sanitized[key] = typeof value === 'object' ? sanitizeObject(value) : value;
  }
  return sanitized;
}

/**
 * Strip HTML tags to prevent stored XSS
 */
function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '');
}

function sanitizeStrings(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return stripHtml(obj);
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeStrings);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeStrings(value);
  }
  return sanitized;
}

const sanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
    req.body = sanitizeStrings(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = { sanitize, sanitizeObject, sanitizeStrings };
