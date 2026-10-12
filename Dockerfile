# ==========================================
# Multi-Stage Production Dockerfile for URL Shortener
# ==========================================

# 1. Builder Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy application source code
COPY src/ ./src/

# Compile TypeScript to JavaScript in /dist
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# 2. Production Runtime Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for docker healthcheck
RUN apk add --no-cache curl

# Copy production files and compiled artifacts
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY public/ ./public/

# Use unprivileged node user
USER node

EXPOSE 3000

# Liveness probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/healthz || exit 1

CMD ["node", "dist/server.js"]
