require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

// Import utilities
const logger = require('./utils/logger');
const { validateStartup } = require('./utils/startup');
const { setupGracefulShutdown } = require('./utils/gracefulShutdown');
const { setupHealthRoutes } = require('./utils/healthCheck');
const { initializeMatchScheduler, stopMatchScheduler } = require('./utils/matchScheduler');

// Import production middleware
const { requestId } = require('./middleware/requestId');
const { sanitize } = require('./middleware/sanitize');
const { hpp } = require('./middleware/hpp');
const { apiHeaders } = require('./middleware/apiHeaders');
const { errorHandler } = require('./middleware/errorHandler');
const { socketAuth } = require('./middleware/socketAuth');
const { performanceMonitor } = require('./middleware/performance');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const matchRoutes = require('./routes/match');
const tournamentRoutes = require('./routes/tournament');
const walletRoutes = require('./routes/wallet');
const withdrawalRoutes = require('./routes/withdrawal');
const adminRoutes = require('./routes/admin');
const kycRoutes = require('./routes/kyc');
const ticketRoutes = require('./routes/ticket');
const notificationRoutes = require('./routes/notification');
const chatRoutes = require('./routes/chat');
const seoRoutes = require('./routes/seo');
const leaderboardRoutes = require('./routes/leaderboard');
const achievementRoutes = require('./routes/achievement');
const teamRoutes = require('./routes/team');
const disputeRoutes = require('./routes/dispute');
const searchRoutes = require('./routes/search');
const analyticsRoutes = require('./routes/analytics');
const socialRoutes = require('./routes/social');
const gamificationRoutes = require('./routes/gamification');
const securityRoutes = require('./routes/security');
const roomRoutes = require('./routes/room');
const playerAnalyticsRoutes = require('./routes/playerAnalytics');
const savedPaymentMethodRoutes = require('./routes/savedPaymentMethod');
const popularityRoutes = require('./routes/popularity');

// ─── Validate environment before anything else ──────────────────────────
validateStartup({ strict: process.env.NODE_ENV === 'production' });

// ─── CORS allowed origins ───────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  ...(process.env.EXTRA_ORIGINS ? process.env.EXTRA_ORIGINS.split(',') : []),
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [])
].filter(Boolean);

// ─── Express app & HTTP server ──────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Trust proxy for rate limiting behind load balancers (Render, Heroku, etc.)
app.set('trust proxy', parseInt(process.env.TRUST_PROXY, 10) || 1);

// Disable x-powered-by header
app.disable('x-powered-by');

// ─── Socket.IO setup ────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB max message size
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Make io accessible to routes
app.set('io', io);

// ─── 1. Request ID (first — everything after can reference it) ──────────
app.use(requestId);

// ─── 2. CORS — MUST be before rate limiting ─────────────────────────────
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-API-Version'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-Response-Time'],
  maxAge: 86400 // 24h preflight cache
}));

// ─── 3. Security middleware ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false
}));
app.use(apiHeaders);

// ─── 4. Rate limiting ──────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path.startsWith('/health/'),
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown'
});
app.use('/api/', limiter);

// OTP specific rate limiter (stricter)
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many OTP requests, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/send-otp', otpLimiter);

// Auth rate limiter (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/verify-otp', authLimiter);
app.use('/api/auth/login', authLimiter);

// ─── 5. Body parsing ───────────────────────────────────────────────────
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification (Razorpay, etc.)
    if (req.originalUrl.includes('/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── 6. Request sanitization ───────────────────────────────────────────
app.use(sanitize);
app.use(hpp({ whitelist: ['tags', 'status', 'type', 'category'] }));

// ─── 7. Compression ────────────────────────────────────────────────────
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// ─── 8. Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  // Structured JSON access logs for production
  app.use(morgan(
    ':remote-addr :method :url :status :res[content-length] - :response-time ms',
    {
      stream: {
        write: (message) => logger.http(message.trim())
      },
      skip: (req) => req.path === '/health' || req.path.startsWith('/health/')
    }
  ));
} else if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev', {
    skip: (req) => req.path === '/health' || req.path.startsWith('/health/')
  }));
}

// ─── 9. Performance monitoring ──────────────────────────────────────────
app.use(performanceMonitor);

// ─── 10. Health checks (before auth middleware) ─────────────────────────
setupHealthRoutes(app);

// Favicon (prevent 404 errors)
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'BattleZone API',
    version: process.env.API_VERSION || '1.0.0',
    status: 'operational',
    docs: '/api/docs',
    health: '/health'
  });
});

// ─── 11. API Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/player-analytics', playerAnalyticsRoutes);
app.use('/api/saved-payment-methods', savedPaymentMethodRoutes);
app.use('/api/popularity', popularityRoutes);

// ─── 12. Socket.IO connection handling ──────────────────────────────────
io.use(socketAuth);

io.on('connection', (socket) => {
  logger.debug(`🔌 User connected: ${socket.userId}`);

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);

  // Join match room
  socket.on('join_match', (matchId) => {
    if (typeof matchId !== 'string' || !matchId.match(/^[a-f0-9]{24}$/)) return;
    socket.join(`match_${matchId}`);
    logger.debug(`User ${socket.userId} joined match ${matchId}`);
  });

  // Join tournament room
  socket.on('join_tournament', (tournamentId) => {
    if (typeof tournamentId !== 'string' || !tournamentId.match(/^[a-f0-9]{24}$/)) return;
    socket.join(`tournament_${tournamentId}`);
    logger.debug(`User ${socket.userId} joined tournament ${tournamentId}`);
  });

  // Leave match room
  socket.on('leave_match', (matchId) => {
    if (typeof matchId !== 'string') return;
    socket.leave(`match_${matchId}`);
    logger.debug(`User ${socket.userId} left match ${matchId}`);
  });

  // Leave tournament room
  socket.on('leave_tournament', (tournamentId) => {
    if (typeof tournamentId !== 'string') return;
    socket.leave(`tournament_${tournamentId}`);
    logger.debug(`User ${socket.userId} left tournament ${tournamentId}`);
  });

  // Join room
  socket.on('join_room', (roomId) => {
    if (typeof roomId !== 'string') return;
    socket.join(`room_${roomId}`);
    logger.debug(`User ${socket.userId} joined room ${roomId}`);
  });

  // Leave room
  socket.on('leave_room', (roomId) => {
    if (typeof roomId !== 'string') return;
    socket.leave(`room_${roomId}`);
    logger.debug(`User ${socket.userId} left room ${roomId}`);
  });

  // Join DM conversation room
  socket.on('join_dm', (conversationId) => {
    if (typeof conversationId !== 'string' || !conversationId.match(/^[a-f0-9]{24}$/)) return;
    socket.join(`dm_${conversationId}`);
    logger.debug(`User ${socket.userId} joined DM conversation ${conversationId}`);
  });

  // Leave DM conversation room
  socket.on('leave_dm', (conversationId) => {
    if (typeof conversationId !== 'string') return;
    socket.leave(`dm_${conversationId}`);
    logger.debug(`User ${socket.userId} left DM conversation ${conversationId}`);
  });

  // Error handling for socket events
  socket.on('error', (error) => {
    logger.error('Socket error:', { userId: socket.userId, error: { message: error.message } });
  });

  socket.on('disconnect', (reason) => {
    logger.debug(`🔌 User disconnected: ${socket.userId} (${reason})`);
  });
});

// ─── 13. Error handling ─────────────────────────────────────────────────
app.use(errorHandler);

// 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ─── 14. MongoDB Connection & Server Start ──────────────────────────────
let matchSchedulerTask = null;

const MONGO_OPTIONS = {
  maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true,
  compressors: ['zstd', 'snappy', 'zlib']
};

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/battlexzone', MONGO_OPTIONS);
    logger.info('✅ MongoDB connected', {
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });

    // Monitor MongoDB connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error:', { error: err });
    });
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected');
    });
    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected');
    });

    // Initialize match scheduler
    matchSchedulerTask = initializeMatchScheduler();
    logger.info('✅ Match scheduler initialized');

    // Start listening
    const PORT = parseInt(process.env.PORT, 10) || 5000;
    server.listen(PORT, () => {
      logger.info(`🚀 BattleZone Server running`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        pid: process.pid,
        node: process.version
      });
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server, {
      matchSchedulerTask,
      stopMatchScheduler,
      io
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', { error });
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
