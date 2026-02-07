/**
 * Startup environment validation
 * Ensures all required environment variables and services are configured
 * before the application starts accepting traffic
 */

const logger = require('./logger');

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET'
];

const RECOMMENDED_ENV_VARS = [
  'FRONTEND_URL',
  'NODE_ENV',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const SECURITY_CHECKS = [
  {
    name: 'JWT_SECRET strength',
    check: () => {
      const secret = process.env.JWT_SECRET;
      if (!secret) return { pass: false, message: 'JWT_SECRET is not set' };
      if (secret.length < 32) return { pass: false, message: 'JWT_SECRET should be at least 32 characters' };
      if (['secret', 'password', 'jwt_secret', 'your-secret'].includes(secret.toLowerCase())) {
        return { pass: false, message: 'JWT_SECRET is using a weak default value' };
      }
      return { pass: true };
    }
  },
  {
    name: 'NODE_ENV is set',
    check: () => {
      if (!process.env.NODE_ENV) {
        return { pass: false, message: 'NODE_ENV is not set, defaulting to development' };
      }
      return { pass: true };
    }
  },
  {
    name: 'Trust proxy configuration',
    check: () => {
      if (process.env.NODE_ENV === 'production' && !process.env.TRUST_PROXY) {
        return { pass: true, message: 'Using default trust proxy (1)' };
      }
      return { pass: true };
    }
  }
];

/**
 * Validate startup environment and configuration
 * @param {Object} options - { strict: boolean } - if strict, process.exit(1) on missing required vars
 */
function validateStartup(options = { strict: true }) {
  logger.info('🔍 Validating startup configuration...');

  let hasErrors = false;

  // Check required environment variables
  const missingRequired = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missingRequired.length > 0) {
    logger.error('❌ Missing required environment variables:', {
      variables: missingRequired
    });
    hasErrors = true;
  }

  // Check recommended environment variables
  const missingRecommended = RECOMMENDED_ENV_VARS.filter(v => !process.env[v]);
  if (missingRecommended.length > 0) {
    logger.warn('⚠️  Missing recommended environment variables:', {
      variables: missingRecommended
    });
  }

  // Run security checks
  for (const check of SECURITY_CHECKS) {
    const result = check.check();
    if (!result.pass) {
      if (process.env.NODE_ENV === 'production') {
        logger.error(`❌ Security check failed: ${check.name} — ${result.message}`);
        hasErrors = true;
      } else {
        logger.warn(`⚠️  Security check: ${check.name} — ${result.message}`);
      }
    }
  }

  if (hasErrors && options.strict && process.env.NODE_ENV === 'production') {
    logger.error('💀 Startup validation failed. Exiting...');
    process.exit(1);
  }

  logger.info('✅ Startup validation complete');
  return !hasErrors;
}

module.exports = { validateStartup };
