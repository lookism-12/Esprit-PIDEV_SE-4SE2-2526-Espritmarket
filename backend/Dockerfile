# ============================================
# ESPRIT MARKET - Backend Dockerfile
# Multi-stage build: Maven → JRE Runtime
# ============================================

# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build application (skip tests - they run in CI)
RUN mvn clean package -DskipTests -B

# Stage 2: Production Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1000 spring && \
    adduser -D -u 1000 -G spring spring

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R spring:spring /app

# Copy JAR from builder stage
COPY --from=builder /app/target/EspritMarket-*.jar app.jar

# Change ownership
RUN chown spring:spring /app/app.jar

# Switch to non-root user
USER spring

# Expose application port
EXPOSE 8090

# JVM options optimized for containers
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8089/api/users || exit 1

# Start application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
