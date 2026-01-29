/**
 * Express app instance for testing (without starting the server)
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Import routes
const authRoutes = require('../routes/auth');
const userRoutes = require('../routes/user');
const matchRoutes = require('../routes/match');
const tournamentRoutes = require('../routes/tournament');
const walletRoutes = require('../routes/wallet');
const withdrawalRoutes = require('../routes/withdrawal');
const adminRoutes = require('../routes/admin');
const kycRoutes = require('../routes/kyc');
const ticketRoutes = require('../routes/ticket');
const notificationRoutes = require('../routes/notification');

// Import middleware
const { errorHandler } = require('../middleware/errorHandler');

const app = express();

// Mock socket.io
const mockIo = {
  to: () => ({ emit: jest.fn() }),
  emit: jest.fn()
};
app.set('io', mockIo);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

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

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

module.exports = app;
