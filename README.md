# BGMI Battle Zone 🎮

A comprehensive battle royale tournament management platform with real-time leaderboards, wallet system, KYC verification, and Razorpay payment integration.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Functionality
- **Tournament Management** - Create and manage battle royale tournaments
- **Real-time Leaderboards** - Live rankings with Socket.io updates
- **User Authentication** - JWT with Google OAuth support
- **Wallet System** - In-app wallet with transaction history
- **Payment Integration** - Razorpay for deposits and withdrawals
- **KYC Verification** - Document validation with Cloudinary
- **Team Management** - Create and manage tournament teams
- **Match Tracking** - Record match results and scores
- **Chat System** - Real-time team communication
- **Notifications** - Push and SMS notifications

### Admin Features
- User management and suspension
- Tournament configuration
- Dispute resolution
- Performance analytics
- Withdrawal approvals

### Security Features
- Helmet security middleware
- Rate limiting on all endpoints
- CORS configuration
- JWT token validation
- Input validation and sanitization

## 🏗️ Architecture

```
bgmi/
├── backend/                 # Node.js Express API
│   ├── config/             # Database, payment, SMS configs
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, error handling
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── utils/             # Helper functions
│   ├── scripts/           # Database migrations
│   └── tests/             # Jest test suites
│
├── frontend/              # Next.js React App
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Next.js pages
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Frontend utilities
│   └── public/           # Static assets
│
├── docker-compose.yml    # Multi-container setup
├── Dockerfile           # Backend containerization
└── nginx.conf          # Reverse proxy config
```

## 🛠️ Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose (for containerized deployment)
- **MongoDB** 6+ (local or Atlas)
- **Redis** 7+ (for caching)
- **npm** 9+

## 📦 Installation

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/bgmi.git
   cd bgmi
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Setup environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your credentials
   
   # Frontend (if needed)
   cp frontend/.env.example frontend/.env
   ```

### Docker Setup (Recommended)

```bash
# Build and start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# View logs
docker-compose logs -f backend
```

## ⚙️ Configuration

### Backend Environment Variables

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/battlezone

# JWT
JWT_SECRET=your-secure-secret-key
JWT_EXPIRES_IN=7d

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Storage
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SMS/OTP
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-auth-token

# Cache
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 🚀 Development

### Start Backend Server

```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

### Start Frontend Dev Server

```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Database Migrations

```bash
cd backend

# Run pending migrations
npm run migrate:latest

# Seed initial data
npm run seed

# Check database
npm run db:check
```

### Build for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Generate coverage report
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## 📦 Deployment

### Quick Start with Docker

```bash
# Build Docker image
docker build -t bgmi:latest .

# Run with docker-compose
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f backend
```

### Production Deployment

See [PRODUCTION-DEPLOYMENT.md](./PRODUCTION-DEPLOYMENT.md) for detailed instructions including:
- Environment setup
- SSL/HTTPS configuration
- Database backup strategy
- Monitoring and logging setup
- Auto-scaling configuration

### CI/CD Pipeline

GitHub Actions automatically:
- Runs tests on every push
- Scans for security vulnerabilities
- Builds Docker image
- Deploys to production on main branch

Configure secrets in GitHub repository settings:
- `DEPLOY_HOST` - Server IP
- `DEPLOY_USER` - SSH user
- `DEPLOY_KEY` - Private SSH key

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register       - User registration
POST   /api/auth/login          - User login
POST   /api/auth/google         - Google OAuth
GET    /api/auth/logout         - Logout
POST   /api/auth/refresh-token  - Refresh JWT
```

### Tournament Endpoints

```
GET    /api/tournaments         - List all tournaments
POST   /api/tournaments         - Create tournament (admin)
GET    /api/tournaments/:id     - Get tournament details
PUT    /api/tournaments/:id     - Update tournament (admin)
POST   /api/tournaments/:id/join - Join tournament
GET    /api/tournaments/:id/leaderboard - Get leaderboard
```

### User Endpoints

```
GET    /api/users/profile       - Get current user
PUT    /api/users/profile       - Update profile
POST   /api/users/kyc           - Submit KYC
GET    /api/users/kyc/status    - Check KYC status
POST   /api/users/avatar        - Upload avatar
```

### Wallet Endpoints

```
GET    /api/wallet/balance      - Get wallet balance
GET    /api/wallet/history      - Transaction history
POST   /api/wallet/deposit      - Create deposit (Razorpay)
POST   /api/wallet/withdraw     - Request withdrawal
```

### Match Endpoints

```
GET    /api/matches             - List matches
POST   /api/matches             - Create match (admin)
PUT    /api/matches/:id/result  - Update match result
GET    /api/matches/:id/details - Get match details
```

For complete API documentation, see `docs/` folder or run:
```bash
npm run docs
```

## 📁 Project Structure

```
backend/
├── app.js                  # Express app initialization
├── server.js              # HTTP server
├── package.json           # Dependencies
├── jest.config.js         # Testing configuration
│
├── config/
│   ├── database.js        # MongoDB connection
│   ├── cloudinary.js      # Image storage config
│   ├── razorpay.js        # Payment gateway config
│   └── sms.js             # SMS service config
│
├── middleware/
│   ├── auth.js            # JWT verification
│   ├── errorHandler.js    # Global error handling
│   └── validator.js       # Input validation
│
├── models/
│   ├── User.js            # User schema
│   ├── Tournament.js      # Tournament schema
│   ├── Match.js           # Match schema
│   └── Wallet.js          # Wallet schema
│
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── tournamentController.js
│   ├── matchController.js
│   └── walletController.js
│
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── tournaments.js
│   ├── matches.js
│   └── wallet.js
│
├── utils/
│   ├── helpers.js         # Utility functions
│   ├── validation.js      # Validation schemas
│   └── notifications.js   # SMS/Push notifications
│
├── scripts/
│   ├── seed.js           # Database seeding
│   └── migrate.js        # Database migrations
│
└── tests/
    ├── auth.test.js
    ├── users.test.js
    └── tournaments.test.js
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and write tests
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow commit message conventions
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Contact development team
- Check documentation in `/docs` folder

## 🔗 Useful Links

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

**Last Updated:** January 29, 2026
**Version:** 1.0.0
**Maintainer:** DevOps Team
