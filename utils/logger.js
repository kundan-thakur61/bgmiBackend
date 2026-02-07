/**
 * Production-grade structured logger
 * Provides JSON logging for production and pretty logging for development
 * Supports request correlation IDs, log levels, and context metadata
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const COLORS = {
  error: '\x1b[31m',   // Red
  warn: '\x1b[33m',    // Yellow
  info: '\x1b[36m',    // Cyan
  http: '\x1b[35m',    // Magenta
  debug: '\x1b[37m',   // White
  reset: '\x1b[0m'
};

class Logger {
  constructor() {
    this.level = LOG_LEVELS[process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')];
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isTest = process.env.NODE_ENV === 'test';
    this.serviceName = process.env.SERVICE_NAME || 'battlezone-api';
  }

  _shouldLog(level) {
    if (this.isTest) return false;
    return LOG_LEVELS[level] <= this.level;
  }

  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();

    if (this.isProduction) {
      // Structured JSON logging for production (parseable by log aggregators)
      return JSON.stringify({
        timestamp,
        level,
        service: this.serviceName,
        message,
        ...meta,
        ...(meta.error && {
          error: {
            message: meta.error.message,
            stack: meta.error.stack,
            code: meta.error.code || meta.error.statusCode
          }
        })
      });
    }

    // Pretty logging for development
    const color = COLORS[level] || COLORS.reset;
    const prefix = `${color}[${level.toUpperCase()}]${COLORS.reset}`;
    const ts = `\x1b[90m${timestamp}\x1b[0m`;
    const metaStr = Object.keys(meta).length > 0
      ? `\n  ${JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')}`
      : '';
    return `${ts} ${prefix} ${message}${metaStr}`;
  }

  error(message, meta = {}) {
    if (this._shouldLog('error')) {
      console.error(this._formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this._shouldLog('warn')) {
      console.warn(this._formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this._shouldLog('info')) {
      console.log(this._formatMessage('info', message, meta));
    }
  }

  http(message, meta = {}) {
    if (this._shouldLog('http')) {
      console.log(this._formatMessage('http', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this._shouldLog('debug')) {
      console.log(this._formatMessage('debug', message, meta));
    }
  }

  /**
   * Create a child logger with preset context
   * Useful for request-scoped logging
   */
  child(context = {}) {
    const childLogger = Object.create(this);
    const parentFormat = this._formatMessage.bind(this);
    childLogger._formatMessage = (level, message, meta = {}) => {
      return parentFormat(level, message, { ...context, ...meta });
    };
    return childLogger;
  }
}

// Singleton instance
const logger = new Logger();

module.exports = logger;
