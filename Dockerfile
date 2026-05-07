# ===========================================
# Innovarketing Dashboard Pro — Dockerfile
# ===========================================

# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY server ./server

# Directorio de datos persistentes (installer.config.json).
# En EasyPanel: montar este path como volumen persistente.
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server/index.js"]
