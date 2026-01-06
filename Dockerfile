# Stage 1: Build
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY src ./src
COPY migrations ./migrations
COPY knexfile.js ./

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Install runtime dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built artifacts from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/knexfile.js ./

# Create necessary directories
RUN mkdir -p assets/temp logs

# Set environment
ENV NODE_ENV=production

# Expose port (default 3000, but configurable via env)
EXPOSE 3000

# Start command
CMD ["node", "build/main.js"]