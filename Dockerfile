# ===========================================
# Innovarketing Dashboard Pro — Dockerfile
# ===========================================

# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server
COPY server ./server

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# No health check - EasyPanel handles this

# Start server
CMD ["node", "server/index.js"]
