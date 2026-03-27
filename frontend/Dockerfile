# ============================================
# ESPRIT MARKET - Frontend Dockerfile
# Multi-stage build: Node → Nginx
# ============================================

# Stage 1: Build Angular Application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build Angular application for production
RUN npm run build -- --configuration production

# Stage 2: Production with Nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY .docker/nginx.conf /etc/nginx/nginx.conf
COPY .docker/default.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app from builder stage
# Angular 17+ outputs to dist/<project-name>/browser
COPY --from=builder /app/dist/esprit-market-front/browser /usr/share/nginx/html

# Create nginx cache and pid directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
