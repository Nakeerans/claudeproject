# Multi-stage build for Job Tracker Application

# Stage 1: Build frontend
FROM node:18-slim AS frontend-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy client source
COPY client/ ./

# Build frontend
RUN npm run build

# Stage 2: Build backend
FROM node:18-slim AS backend-builder

WORKDIR /app

# Copy backend package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source
COPY src/ ./src/
COPY prisma/ ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Stage 3: Production image
FROM node:18-slim

WORKDIR /app

# Install curl and OpenSSL for Prisma and healthchecks
RUN apt-get update && apt-get install -y \
    curl \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies and source
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/src ./src
COPY --from=backend-builder /app/prisma ./prisma
COPY package*.json ./

# Copy frontend build
COPY --from=frontend-builder /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p uploads

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run database migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server/index.js"]
