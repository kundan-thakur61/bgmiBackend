# ─── Stage 1: Install dependencies ──────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files only (for better Docker layer caching)
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# ─── Stage 2: Production image ─────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper PID 1 signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy dependencies from builder stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs backend/ .

# Remove test files, docs, and development artifacts
RUN rm -rf tests __mocks__ *.md docs coverage .env .env.local

# Set proper permissions
RUN chmod -R 755 /app

# Switch to non-root user
USER nodejs

# Expose port (documentation only, actual port set by env)
EXPOSE 5000

# Environment defaults
ENV NODE_ENV=production \
    PORT=5000 \
    SHUTDOWN_TIMEOUT_MS=15000

# Liveness check: is the process alive?
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -sf http://localhost:${PORT}/health/live || exit 1

# Use dumb-init to handle signals properly (SIGTERM, SIGINT)
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "app.js"]
