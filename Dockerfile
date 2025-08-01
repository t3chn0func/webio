# WebRTC SIP API - Multi-stage Docker Build
# Optimized for production deployment with security and performance

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Remove development files
RUN rm -rf \
    .git \
    .gitignore \
    .env.example \
    *.md \
    docs/ \
    tests/ \
    __tests__/ \
    .github/ \
    .vscode/ \
    coverage/ \
    .nyc_output/

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    tzdata

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webrtc -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=webrtc:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=webrtc:nodejs /app/src ./src
COPY --from=builder --chown=webrtc:nodejs /app/package*.json ./
COPY --from=builder --chown=webrtc:nodejs /app/index.html ./
COPY --from=builder --chown=webrtc:nodejs /app/sip-config.js ./
COPY --from=builder --chown=webrtc:nodejs /app/ecosystem.config.js ./

# Create required directories
RUN mkdir -p data logs backups && \
    chown -R webrtc:nodejs data logs backups

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    WS_PORT=8080 \
    LOG_LEVEL=info \
    DB_PATH=/app/data/calls.db \
    LOG_FILE=/app/logs/app.log

# Expose ports
EXPOSE 3000 8080

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Switch to non-root user
USER webrtc

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/api-server.js"]

# Metadata
LABEL maintainer="WebRTC SIP API Team" \
      version="1.0.0" \
      description="WebRTC SIP API for real-time communication" \
      org.opencontainers.image.title="WebRTC SIP API" \
      org.opencontainers.image.description="Production-ready WebRTC SIP API with WebSocket support" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.source="https://github.com/your-org/webrtc-sip-api" \
      org.opencontainers.image.licenses="MIT"