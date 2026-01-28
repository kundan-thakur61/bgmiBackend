const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Note: Razorpay and Cloudinary mocks are in tests/mocks.js which runs before this

// Setup before all tests
beforeAll(async () => {
  // Close any existing connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Read the mongo URI from the config file created by globalSetup
  const configPath = path.join(__dirname, 'test-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const mongoUri = config.mongoUri;

  // Set environment variables for tests
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
  process.env.JWT_EXPIRES_IN = '7d';
  process.env.NODE_ENV = 'test';
  process.env.RAZORPAY_KEY_ID = 'test_razorpay_key';
  process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
  process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
  process.env.CLOUDINARY_API_KEY = 'test_api_key';
  process.env.CLOUDINARY_API_SECRET = 'test_api_secret';

  // Connect to the shared in-memory database
  await mongoose.connect(mongoUri);
}, 120000); // 2 minutes timeout for first run

// Clear database between tests
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

// Suppress console logs during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
