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

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { socketAuth } = require('./middleware/socketAuth');
const { performanceMonitor } = require('./middleware/performance');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://bgmifrontendcode.vercel.app'
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// CORS - MUST be before rate limiting
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://bgmifrontendcode.vercel.app'
  ].filter(Boolean),
  credentials: true
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false
});
app.use('/api/', limiter);

// OTP specific rate limiter (stricter)
const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute
  message: { success: false, message: 'Too many OTP requests, please try again after a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth/send-otp', otpLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Performance monitoring
app.use(performanceMonitor);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/battlezone')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
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

// Socket.io connection handling
io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.userId}`);

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);

  // Join match room
  socket.on('join_match', (matchId) => {
    socket.join(`match_${matchId}`);
    console.log(`User ${socket.userId} joined match ${matchId}`);
  });

  // Join tournament room
  socket.on('join_tournament', (tournamentId) => {
    socket.join(`tournament_${tournamentId}`);
    console.log(`User ${socket.userId} joined tournament ${tournamentId}`);
  });

  // Leave match room
  socket.on('leave_match', (matchId) => {
    socket.leave(`match_${matchId}`);
    console.log(`User ${socket.userId} left match ${matchId}`);
  });

  // Leave tournament room
  socket.on('leave_tournament', (tournamentId) => {
    socket.leave(`tournament_${tournamentId}`);
    console.log(`User ${socket.userId} left tournament ${tournamentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.userId}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 BattleZone Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };
