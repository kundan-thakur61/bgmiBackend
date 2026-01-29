# Multi-stage build for backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY backend/ .

# Remove test files and development artifacts
RUN rm -rf tests __mocks__ *.md

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy from builder
COPY --from=backend-builder --chown=nodejs:nodejs /app .

# Copy frontend build (if available)
COPY --chown=nodejs:nodejs frontend/.next ./public/.next 2>/dev/null || true

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "app.js"]
