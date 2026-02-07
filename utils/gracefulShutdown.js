/**
 * Graceful shutdown handler
 * Ensures all connections are properly closed before the process exits
 * Handles SIGTERM, SIGINT, uncaught exceptions, and unhandled rejections
 */

const mongoose = require('mongoose');
const logger = require('./logger');

const SHUTDOWN_TIMEOUT_MS = parseInt(process.env.SHUTDOWN_TIMEOUT_MS, 10) || 15000;

let isShuttingDown = false;

/**
 * Setup graceful shutdown handlers
 * @param {http.Server} server - HTTP server instance
 * @param {Object} options - { matchSchedulerTask, io }
 */
function setupGracefulShutdown(server, options = {}) {
  const { matchSchedulerTask, stopMatchScheduler, io } = options;

  async function shutdown(signal) {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring duplicate signal');
      return;
    }
    isShuttingDown = true;
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Set a hard timeout to force exit if graceful shutdown takes too long
    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    try {
      // 1. Stop accepting new connections
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            logger.error('Error closing HTTP server:', { error: err });
          } else {
            logger.info('✅ HTTP server closed');
          }
          resolve();
        });
      });

      // 2. Stop match scheduler
      if (matchSchedulerTask && stopMatchScheduler) {
        try {
          stopMatchScheduler(matchSchedulerTask);
          logger.info('✅ Match scheduler stopped');
        } catch (err) {
          logger.error('Error stopping match scheduler:', { error: err });
        }
      }

      // 3. Close Socket.IO connections
      if (io) {
        try {
          io.close();
          logger.info('✅ Socket.IO connections closed');
        } catch (err) {
          logger.error('Error closing Socket.IO:', { error: err });
        }
      }

      // 4. Close database connection
      try {
        await mongoose.connection.close();
        logger.info('✅ MongoDB connection closed');
      } catch (err) {
        logger.error('Error closing MongoDB:', { error: err });
      }

      logger.info('👋 Graceful shutdown complete');
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', { error });
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  }

  // OS signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Uncaught exceptions — log and exit (do NOT swallow)
  process.on('uncaughtException', (error) => {
    logger.error('💥 UNCAUGHT EXCEPTION:', {
      error: { message: error.message, stack: error.stack, name: error.name }
    });
    shutdown('uncaughtException');
  });

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('💥 UNHANDLED REJECTION:', {
      reason: reason instanceof Error
        ? { message: reason.message, stack: reason.stack }
        : reason
    });
    // In production, treat as fatal error
    if (process.env.NODE_ENV === 'production') {
      shutdown('unhandledRejection');
    }
  });

  return { isShuttingDown: () => isShuttingDown };
}

module.exports = { setupGracefulShutdown };
