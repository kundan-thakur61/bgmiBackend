/**
 * Production-grade API response headers middleware
 * Adds security, caching, and informational headers
 */

const apiHeaders = (req, res, next) => {
  // API version header
  res.setHeader('X-API-Version', process.env.API_VERSION || '1.0.0');

  // Remove X-Powered-By (helmet does this too, but be explicit)
  res.removeHeader('X-Powered-By');

  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Strict Transport Security (HSTS) — for HTTPS deployments
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Disable client-side caching for API responses by default
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  next();
};

module.exports = { apiHeaders };
