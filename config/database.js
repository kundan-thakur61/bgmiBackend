const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGO_OPTIONS = {
  maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
  compressors: ['zstd', 'snappy', 'zlib'],
  // Auto-index only in development (performance impact in production)
  autoIndex: process.env.NODE_ENV !== 'production'
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, MONGO_OPTIONS);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`, {
      database: conn.connection.name,
      poolSize: MONGO_OPTIONS.maxPoolSize
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB error:', { error: err });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });

    // Log slow queries in development
    if (process.env.NODE_ENV !== 'production') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        logger.debug(`Mongoose: ${collectionName}.${method}`, {
          query: JSON.stringify(query).substring(0, 200)
        });
      });
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error('❌ Database connection failed:', { error });
    process.exit(1);
  }
};

module.exports = connectDB;
