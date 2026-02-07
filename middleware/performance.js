const logger = require('../utils/logger');

// Track API metrics in-memory (for /health endpoint)
const metrics = {
  totalRequests: 0,
  totalErrors: 0,
  slowRequests: 0,
  avgResponseTime: 0,
  _responseTimes: []
};

const SLOW_REQUEST_THRESHOLD_MS = parseInt(process.env.SLOW_REQUEST_THRESHOLD_MS, 10) || 1000;
const METRICS_WINDOW_SIZE = 1000; // Keep last 1000 response times

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime.bigint(); // Nanosecond precision

  metrics.totalRequests++;

  // Store the original end function
  const originalEnd = res.end;

  // Override res.end to capture timing
  res.end = function (...args) {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = Math.round(durationNs / 1e6);

    // Safely try to set header
    try {
      if (!res.headersSent && !res.writableEnded && !res.finished) {
        res.setHeader('X-Response-Time', `${durationMs}ms`);
      }
    } catch (err) {
      // Silently ignore header setting errors
    }

    // Track metrics
    if (res.statusCode >= 400) {
      metrics.totalErrors++;
    }

    // Rolling window of response times
    metrics._responseTimes.push(durationMs);
    if (metrics._responseTimes.length > METRICS_WINDOW_SIZE) {
      metrics._responseTimes.shift();
    }
    metrics.avgResponseTime = Math.round(
      metrics._responseTimes.reduce((a, b) => a + b, 0) / metrics._responseTimes.length
    );

    // Log slow requests
    if (durationMs > SLOW_REQUEST_THRESHOLD_MS) {
      metrics.slowRequests++;
      logger.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${durationMs}ms`, {
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        userId: req.userId?.toString()
      });
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

module.exports = { performanceMonitor, cacheControl, preloadHeaders, metrics };
