# Multi-stage Docker build for EyeZen Chrome Extension Backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY core/ ./core/
COPY types/ ./types/
COPY background/ ./background/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S eyezen -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=eyezen:nodejs /app/dist ./dist
COPY --from=builder --chown=eyezen:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=eyezen:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p /app/data && chown eyezen:nodejs /app/data
RUN mkdir -p /app/logs && chown eyezen:nodejs /app/logs

# Switch to non-root user
USER eyezen

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]

# Labels for metadata
LABEL maintainer="EyeZen Team"
LABEL version="1.0.0"
LABEL description="EyeZen Chrome Extension Backend Services"