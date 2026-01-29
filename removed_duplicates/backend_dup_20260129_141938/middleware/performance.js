// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = Date.now();

  // Store the original end function
  const originalEnd = res.end;

  // Override res.end to capture timing
  res.end = function (...args) {
    const duration = Date.now() - start;

    // Safely try to set header (with multiple checks to prevent ERR_HTTP_HEADERS_SENT)
    try {
      if (!res.headersSent && !res.writableEnded && !res.finished) {
        res.setHeader('X-Response-Time', `${duration}ms`);
      }
    } catch (err) {
      // Silently ignore header setting errors - response timing is not critical
    }

    // Log slow requests (> 1000ms)
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }

    // Call original end
    return originalEnd.apply(this, args);
  };

  next();
};

// Cache control middleware
const cacheControl = (duration = 3600) => {
  return (req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${duration}`);
    next();
  };
};

// Preload critical resources
const preloadHeaders = (req, res, next) => {
  res.setHeader('Link', [
    '</static/css/main.css>; rel=preload; as=style',
    '</static/js/main.js>; rel=preload; as=script',
    '</fonts/main.woff2>; rel=preload; as=font; crossorigin'
  ].join(', '));
  next();
};

module.exports = { performanceMonitor, cacheControl, preloadHeaders };
