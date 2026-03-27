# ============================================
# ESPRIT MARKET - Backend Dockerfile
# Multi-stage build: Maven → JRE Runtime
# ============================================

# --------------------------
# Stage 1: Build with Maven
# --------------------------
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .

# Download dependencies offline (skip tests)
RUN mvn dependency:go-offline -Dmaven.test.skip=true -B

# Copy all source code (main + resources)
COPY src ./src

# Build application - skip all tests and test compilation
RUN mvn clean package -DskipTests -Dmaven.test.skip=true -B

# --------------------------
# Stage 2: Production Runtime
# --------------------------
FROM eclipse-temurin:17-jre

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -g 1001 spring && \
    useradd -u 1001 -g spring -m spring

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R spring:spring /app

# Copy JAR from builder stage
COPY --from=builder /app/target/EspritMarket-*.jar app.jar

# Change ownership of JAR
RUN chown spring:spring /app/app.jar

# Switch to non-root user
USER spring

# Expose application port
EXPOSE 8089

# JVM options optimized for containers
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:8089/api/users || exit 1

# Start application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]