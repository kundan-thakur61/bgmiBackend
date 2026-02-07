/**
 * Production-grade health check system
 * Provides liveness, readiness, and detailed health endpoints
 * Compatible with Kubernetes, Docker, and cloud load balancers
 */

const mongoose = require('mongoose');
const os = require('os');

// Track application start time
const startTime = Date.now();

/**
 * Get detailed health status of all dependencies
 */
async function getHealthStatus() {
  const checks = {};

  // Database check
  try {
    const dbState = mongoose.connection.readyState;
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    checks.database = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      state: dbStates[dbState] || 'unknown',
      latency: await measureDbLatency()
    };
  } catch (error) {
    checks.database = { status: 'unhealthy', error: error.message };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsedPercent = ((totalMem - freeMem) / totalMem * 100).toFixed(1);
  checks.memory = {
    status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB heap threshold
    heapUsed: formatBytes(memUsage.heapUsed),
    heapTotal: formatBytes(memUsage.heapTotal),
    rss: formatBytes(memUsage.rss),
    external: formatBytes(memUsage.external),
    systemTotal: formatBytes(totalMem),
    systemFree: formatBytes(freeMem),
    systemUsedPercent: `${memUsedPercent}%`
  };

  // CPU check
  const cpuLoad = os.loadavg();
  const cpuCount = os.cpus().length;
  checks.cpu = {
    status: cpuLoad[0] / cpuCount < 0.8 ? 'healthy' : 'warning',
    cores: cpuCount,
    loadAvg1m: cpuLoad[0].toFixed(2),
    loadAvg5m: cpuLoad[1].toFixed(2),
    loadAvg15m: cpuLoad[2].toFixed(2)
  };

  // Process check
  checks.process = {
    status: 'healthy',
    uptime: formatUptime(process.uptime()),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };

  // Overall status
  const allHealthy = Object.values(checks).every(c => c.status !== 'unhealthy');
  const hasWarnings = Object.values(checks).some(c => c.status === 'warning');

  return {
    status: allHealthy ? (hasWarnings ? 'degraded' : 'healthy') : 'unhealthy',
    version: process.env.npm_package_version || process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(process.uptime()),
    checks
  };
}

/**
 * Measure database round-trip latency
 */
async function measureDbLatency() {
  if (mongoose.connection.readyState !== 1) return null;
  const start = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
    return `${Date.now() - start}ms`;
  } catch {
    return null;
  }
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * Setup health check routes on an Express app
 */
function setupHealthRoutes(app) {
  // Liveness probe — is the process alive?
  app.get('/health/live', (req, res) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  });

  // Readiness probe — is the app ready to serve traffic?
  app.get('/health/ready', async (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    if (dbReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        reason: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Detailed health — full system diagnostics
  app.get('/health', async (req, res) => {
    try {
      const health = await getHealthStatus();
      const httpStatus = health.status === 'unhealthy' ? 503 : 200;
      res.status(httpStatus).json(health);
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Startup probe — has initial setup completed?
  app.get('/health/startup', (req, res) => {
    const uptimeMs = Date.now() - startTime;
    // Consider started after 5 seconds or when DB is connected
    const isStarted = uptimeMs > 5000 || mongoose.connection.readyState === 1;
    res.status(isStarted ? 200 : 503).json({
      status: isStarted ? 'started' : 'starting',
      uptimeMs,
      timestamp: new Date().toISOString()
    });
  });
}

module.exports = { setupHealthRoutes, getHealthStatus };
