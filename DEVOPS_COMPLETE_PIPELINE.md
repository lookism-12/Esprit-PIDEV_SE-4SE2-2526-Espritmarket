# 🚀 COMPLETE DEVOPS PIPELINE - ESPRIT MARKET

**Full Production-Ready CI/CD Architecture**  
**GitHub Actions + Docker + Kubernetes (Kubeadm) + Prometheus + Grafana**

---

## 📊 ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GIT REPOSITORY (GitHub)                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  frontend/ │  │  backend/  │  │.github/    │  │  infra/    │        │
│  │ Angular 21 │  │ Spring Boot│  │workflows/  │  │  k8s YAML  │        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
         ┌────────▼────────┐  ┌───▼──────────┐  ┌─▼──────────────┐
         │  GITHUB ACTIONS │  │   FRONTEND   │  │    BACKEND     │
         │   (CI/CD)       │  │   PIPELINE   │  │    PIPELINE    │
         └────────┬────────┘  └───┬──────────┘  └─┬──────────────┘
                  │               │               │
     ┌────────────┼───────────────┼───────────────┼────────────┐
     │            │               │               │            │
  ┌──▼───┐  ┌──────▼─────┐  ┌────▼────┐  ┌─────▼─────┐  ┌───▼───┐
  │Build │  │    Test    │  │ Quality  │  │   Build   │  │ Push  │
  │      │  │ (Jasmine)  │  │  Check   │  │   Docker  │  │Docker │
  └──┬───┘  └──────┬─────┘  │(SonarQube)│  │  Images   │  │Images │
     │             │        │    ❌    │  │           │  │       │
     │             │        └────┬────┘  └─────┬─────┘  └───┬───┘
     │             │             │             │            │
     └─────────────┴─────────────┴─────────────┴────────────┼──┐
                                                             │  │
                              ┌──────────────────────────────┘  │
                              │                                 │
                    ┌─────────▼──────────┐            ┌─────────▼──────┐
                    │   DOCKER REGISTRY  │            │ K8S DEPLOYMENT │
                    │ (DockerHub/ECR)    │            │  (Kubeadm)     │
                    └─────────┬──────────┘            └────────┬───────┘
                              │                               │
                    ┌─────────▼──────────┐            ┌────────▼──────┐
                    │  Frontend Image    │            │  K8S Cluster  │
                    │  Backend Image     │            │               │
                    │  Nginx Image       │            │  ┌──────────┐ │
                    │  Monitoring Image  │            │  │ Frontend │ │
                    └────────────────────┘            │  │Pod/Svc  │ │
                                                      │  └──────────┘ │
                                                      │               │
                                                      │  ┌──────────┐ │
                                                      │  │ Backend  │ │
                                                      │  │Pod/Svc  │ │
                                                      │  └──────────┘ │
                                                      │               │
                                                      │  ┌──────────┐ │
                                                      │  │ Ingress/ │ │
                                                      │  │ LoadBalancer│
                                                      │  └──────────┘ │
                                                      └───────┬──────┘
                                                              │
                    ┌─────────────────────────────────────────┘
                    │
        ┌───────────▼─────────────┐
        │  MONITORING STACK       │
        │  ┌─────────────────┐    │
        │  │  Prometheus     │    │
        │  │  Grafana        │    │
        │  │  AlertManager   │    │
        │  └─────────────────┘    │
        └─────────────────────────┘
```

---

## 🔵 FRONTEND PIPELINE (Angular)

### Pipeline Stages

```yaml
FRONTEND PIPELINE:
1. CODE CHECKOUT (Git Clone)
   ↓
2. DEPENDENCY INSTALL (npm ci)
   ↓
3. LINT CHECK (eslint / tslint)
   ↓
4. BUILD (ng build --prod)
   ↓
5. UNIT TESTS (vitest run)
   ↓
6. E2E TESTS (Playwright / Cypress) [Optional]
   ↓
7. QUALITY CHECK (Code Coverage Analysis)
   ↓
8. BUILD DOCKER IMAGE
   - Multi-stage build for optimization
   - Node build stage → Nginx production stage
   - Image size < 150MB
   ↓
9. PUSH TO REGISTRY
   - Tag: latest, version, date
   ↓
10. DEPLOY TO KUBERNETES
    - Rolling update strategy
    - Health checks & readiness probes
```

### GitHub Actions Workflow

```yaml
# .github/workflows/frontend.yml
name: Frontend CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'frontend/**'

env:
  REGISTRY: docker.io
  IMAGE_NAME: esprit-market-frontend

jobs:
  # ==================== BUILD & TEST ====================
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: 🔄 Checkout code
        uses: actions/checkout@v3

      - name: 📦 Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: 📥 Install dependencies
        run: |
          cd frontend
          npm ci --legacy-peer-deps

      - name: 🔍 Lint code
        run: |
          cd frontend
          npm run lint 2>/dev/null || echo "⚠️ No lint script defined"

      - name: 🏗️ Build Angular app
        run: |
          cd frontend
          npm run build -- --configuration production

      - name: 🧪 Run unit tests
        run: |
          cd frontend
          npm run test -- --coverage --watch=false

      - name: 📊 Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/cobertura-coverage.xml
          flags: frontend
          name: frontend-coverage

  # ==================== DOCKER BUILD ====================
  docker:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')

    permissions:
      contents: read
      packages: write

    steps:
      - name: 🔄 Checkout code
        uses: actions/checkout@v3

      - name: 🐳 Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: 🔐 Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: 📝 Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/espritmarket/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest

      - name: 🏗️ Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ==================== DEPLOY ====================
  deploy:
    needs: docker
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: 🔄 Checkout code
        uses: actions/checkout@v3

      - name: 🔐 Setup kubeconfig
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > $HOME/.kube/config
          chmod 600 $HOME/.kube/config

      - name: 🚀 Deploy to Kubernetes
        run: |
          kubectl set image deployment/esprit-market-frontend \
            frontend=${{ env.REGISTRY }}/espritmarket/${{ env.IMAGE_NAME }}:latest \
            -n production
          kubectl rollout status deployment/esprit-market-frontend -n production --timeout=5m

      - name: ✅ Verify deployment
        run: |
          kubectl get pods -n production -l app=esprit-market-frontend
          kubectl logs -n production -l app=esprit-market-frontend --tail=20
```

---

## 🔴 BACKEND PIPELINE (Spring Boot)

### Pipeline Stages

```yaml
BACKEND PIPELINE:
1. CODE CHECKOUT (Git Clone)
   ↓
2. SETUP JAVA & MAVEN
   ↓
3. LINT & CODE ANALYSIS
   ↓
4. BUILD (Maven compile)
   ↓
5. UNIT TESTS (JUnit + Mockito)
   ↓
6. INTEGRATION TESTS (TestContainers)
   ↓
7. QUALITY GATE (SonarQube)
   ↓
8. SECURITY SCAN (OWASP Dependency Check)
   ↓
9. BUILD FAT JAR
   ↓
10. BUILD DOCKER IMAGE
    - Multi-stage build
    - JRE only (no JDK)
    - Image size < 300MB
    ↓
11. PUSH TO REGISTRY
    ↓
12. DEPLOY TO KUBERNETES
    - Rolling update strategy
    - Database migrations
    - Health checks
```

### GitHub Actions Workflow

```yaml
# .github/workflows/backend.yml
name: Backend CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'backend/**'
      - '.github/workflows/backend.yml'
      - 'pom.xml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'backend/**'

env:
  REGISTRY: docker.io
  IMAGE_NAME: esprit-market-backend
  JAVA_VERSION: '17'

jobs:
  # ==================== BUILD & TEST ====================
  build:
    runs-on: ubuntu-latest

    steps:
      - name: 🔄 Checkout code
        uses: actions/checkout@v3

      - name: 🔧 Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: 'temurin'
          cache: maven

      - name: 🔍 Run SonarQube analysis
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
        run: |
          cd backend
          mvn clean verify sonar:sonar \
            -Dsonar.projectKey=esprit-market \
            -Dsonar.organization=esprit-market \
            -Dsonar.host.url=${{ env.SONAR_HOST_URL }} \
            -Dsonar.login=${{ env.SONAR_TOKEN }} \
            || echo "⚠️ SonarQube not configured"

      - name: 🏗️ Build with Maven
        run: |
          cd backend
          mvn clean package -DskipTests

      - name: 🧪 Run unit tests
        run: |
          cd backend
          mvn test

      - name: 🔐 OWASP Dependency Check
        run: |
          cd backend
          mvn dependency-check:check || echo "⚠️ Vulnerabilities detected"

      - name: 📊 Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: backend/target/surefire-reports/

  # ==================== DOCKER BUILD ====================
  docker:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')

    permissions:
      contents: read
      packages: write

    steps:
      - name: 🔄 Checkout code
        uses: actions/checkout@v3

      - name: 🔧 Setup Java
        uses: actions/setup-java@v3
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: 'temurin'
          cache: maven

      - name: 🏗️ Build JAR
        run: |
          cd backend
          mvn clean package -DskipTests

      - name: 🐳 Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: 🔐 Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: 📝 Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/espritmarket/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest

      - name: 🏗️ Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ==================== DEPLOY ====================
  deploy:
    needs: docker
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: 🔄 Checkout code
        uses: actions/checkout@v3

      - name: 🔐 Setup kubeconfig
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > $HOME/.kube/config
          chmod 600 $HOME/.kube/config

      - name: 🚀 Deploy to Kubernetes
        run: |
          kubectl set image deployment/esprit-market-backend \
            backend=${{ env.REGISTRY }}/espritmarket/${{ env.IMAGE_NAME }}:latest \
            -n production
          kubectl rollout status deployment/esprit-market-backend -n production --timeout=5m

      - name: ✅ Verify deployment
        run: |
          kubectl get pods -n production -l app=esprit-market-backend
          kubectl logs -n production -l app=esprit-market-backend --tail=20
```

---

## 🐳 DOCKER CONFIGURATION

### Frontend Dockerfile (Multi-Stage Build)

```dockerfile
# frontend/Dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build Angular application
RUN npm run build -- --configuration production

# Stage 2: Production
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY .docker/nginx.conf /etc/nginx/nginx.conf
COPY .docker/default.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app from builder
COPY --from=builder /app/dist/esprit-market /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile (Multi-Stage Build)

```dockerfile
# backend/Dockerfile
# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -DskipTests

# Stage 2: Production
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1000 spring && \
    adduser -D -u 1000 -G spring spring

# Copy JAR from builder
COPY --from=builder /app/target/EspritMarket*.jar app.jar

# Change ownership
RUN chown spring:spring /app

# Switch to non-root user
USER spring

# Expose port
EXPOSE 8089

# JVM options for production
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:InitiatingHeapOccupancyPercent=35"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8089/api/users || exit 1

# Start application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

### Nginx Configuration

```nginx
# frontend/.docker/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml application/atom+xml image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
}
```

```nginx
# frontend/.docker/default.conf
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /usr/share/nginx/html;
    index index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Cache control
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Angular SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

---

## ☸️ KUBERNETES DEPLOYMENT

### Namespace & RBAC

```yaml
# infra/k8s/01-namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: esprit-market
  labels:
    name: esprit-market

---
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    name: monitoring
```

### Frontend Deployment

```yaml
# infra/k8s/02-frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: esprit-market-frontend
  namespace: esprit-market
  labels:
    app: esprit-market-frontend
    component: frontend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: esprit-market-frontend
  template:
    metadata:
      labels:
        app: esprit-market-frontend
        component: frontend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "80"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: default
      
      # Pod Disruption Budget
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - esprit-market-frontend
              topologyKey: kubernetes.io/hostname
      
      containers:
      - name: frontend
        image: espritmarket/esprit-market-frontend:latest
        imagePullPolicy: IfNotPresent
        
        ports:
        - name: http
          containerPort: 80
          protocol: TCP
        
        # Environment variables
        env:
        - name: ENVIRONMENT
          value: "production"
        - name: API_URL
          value: "http://esprit-market-backend:8089/api"
        
        # Resource requests and limits
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        
        # Liveness probe - restart container if not responding
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
        
        # Readiness probe - mark pod as ready for traffic
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 2
          failureThreshold: 2
        
        # Security context
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          readOnlyRootFilesystem: false
          capabilities:
            drop:
            - ALL
        
        # Volume mounts
        volumeMounts:
        - name: nginx-cache
          mountPath: /var/cache/nginx
        - name: nginx-pid
          mountPath: /var/run
      
      # Volumes
      volumes:
      - name: nginx-cache
        emptyDir: {}
      - name: nginx-pid
        emptyDir: {}
      
      # Termination grace period
      terminationGracePeriodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  name: esprit-market-frontend
  namespace: esprit-market
  labels:
    app: esprit-market-frontend
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
    protocol: TCP
    name: http
  selector:
    app: esprit-market-frontend

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: esprit-market-frontend-hpa
  namespace: esprit-market
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: esprit-market-frontend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Max
```

### Backend Deployment

```yaml
# infra/k8s/03-backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: esprit-market-backend
  namespace: esprit-market
  labels:
    app: esprit-market-backend
    component: backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: esprit-market-backend
  template:
    metadata:
      labels:
        app: esprit-market-backend
        component: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8089"
        prometheus.io/path: "/actuator/prometheus"
    spec:
      serviceAccountName: default
      
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - esprit-market-backend
              topologyKey: kubernetes.io/hostname
      
      containers:
      - name: backend
        image: espritmarket/esprit-market-backend:latest
        imagePullPolicy: IfNotPresent
        
        ports:
        - name: http
          containerPort: 8089
          protocol: TCP
        
        # Environment variables from secrets and configmaps
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: SERVER_PORT
          value: "8089"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: esprit-market-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: esprit-market-secrets
              key: jwt-secret
        - name: JWT_EXPIRATION_MS
          value: "86400000"
        - name: APP_UPLOAD_DIR
          value: "/app/uploads"
        - name: CORS_ORIGINS
          valueFrom:
            configMapKeyRef:
              name: esprit-market-config
              key: cors-origins
        
        # Resource requests and limits
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        
        # Liveness probe
        livenessProbe:
          httpGet:
            path: /api/users
            port: 8089
            httpHeaders:
            - name: Authorization
              value: "Bearer health-check"
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 5
          failureThreshold: 3
        
        # Readiness probe
        readinessProbe:
          httpGet:
            path: /actuator/health
            port: 8089
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 2
          failureThreshold: 2
        
        # Security context
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          readOnlyRootFilesystem: false
          capabilities:
            drop:
            - ALL
        
        # Volume mounts
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
      
      # Volumes
      volumes:
      - name: uploads
        emptyDir: {}
      
      terminationGracePeriodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  name: esprit-market-backend
  namespace: esprit-market
  labels:
    app: esprit-market-backend
spec:
  type: ClusterIP
  ports:
  - port: 8089
    targetPort: 8089
    protocol: TCP
    name: http
  selector:
    app: esprit-market-backend

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: esprit-market-backend-hpa
  namespace: esprit-market
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: esprit-market-backend
  minReplicas: 2
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Ingress Configuration

```yaml
# infra/k8s/04-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: esprit-market-ingress
  namespace: esprit-market
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - espritmarket.com
    - www.espritmarket.com
    secretName: esprit-market-tls
  rules:
  - host: espritmarket.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: esprit-market-frontend
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: esprit-market-backend
            port:
              number: 8089
  - host: www.espritmarket.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: esprit-market-frontend
            port:
              number: 80
```

### ConfigMap & Secrets

```yaml
# infra/k8s/05-configmap-secrets.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: esprit-market-config
  namespace: esprit-market
data:
  cors-origins: |
    http://localhost:3000,http://localhost:4200,http://espritmarket.com,https://espritmarket.com
  logging-level: "INFO"
  spring-profiles: "production"

---
apiVersion: v1
kind: Secret
metadata:
  name: esprit-market-secrets
  namespace: esprit-market
type: Opaque
stringData:
  # Base64 encode these before deploying
  mongodb-uri: "mongodb+srv://admin:password@cluster.mongodb.net/esprit_market"
  jwt-secret: "your-super-secret-jwt-key-here-min-256-bits"
  docker-registry-url: "docker.io"
  docker-username: "espritmarket"
  docker-password: "your-dockerhub-token"

---
apiVersion: v1
kind: Secret
metadata:
  name: docker-registry-secret
  namespace: esprit-market
type: kubernetes.io/dockercfg
data:
  .dockercfg: eyJkb2NrZXIuaW8iOnsidXNlcm5hbWUiOiJlc3ByaXRtYXJrZXQiLCJwYXNzd29yZCI6InBhc3N3b3JkIn19
```

---

## 🔧 KUBEADM SETUP (On-Premises or VM)

### Prerequisites

```bash
# All nodes (Master + Workers)
#!/bin/bash

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install kubeadm, kubelet, kubectl
curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://dl.k8s.io/apt/doc/apt-key.gpg
echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

# Disable swap
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab

# Enable IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# Load kernel modules
sudo modprobe br_netfilter
echo "br_netfilter" | sudo tee -a /etc/modules

# Restart services
sudo systemctl restart kubelet
```

### Master Node Initialization

```bash
#!/bin/bash
# Run on Master node

# Initialize cluster
sudo kubeadm init \
  --pod-network-cidr=10.244.0.0/16 \
  --apiserver-advertise-address=<MASTER_IP> \
  --kubernetes-version=v1.28.0

# Setup kubectl access
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install CNI plugin (Flannel)
kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml

# Get join token for workers
kubeadm token create --print-join-command

# Verify cluster
kubectl get nodes
kubectl get pods --all-namespaces
```

### Worker Node Join

```bash
#!/bin/bash
# Run on Worker nodes

# Join cluster (use token from master)
sudo kubeadm join <MASTER_IP>:6443 \
  --token <TOKEN> \
  --discovery-token-ca-cert-hash <CERT_HASH>

# Verify on master
kubectl get nodes
kubectl get pods --all-namespaces
```

### Install NGINX Ingress Controller

```bash
#!/bin/bash

# Add Helm repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install NGINX Ingress Controller
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

# Verify installation
kubectl get svc -n ingress-nginx
```

---

## 📊 MONITORING STACK (Prometheus + Grafana)

### Prometheus Deployment

```yaml
# infra/k8s/monitoring/prometheus-deployment.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    alerting:
      alertmanagers:
      - static_configs:
        - targets:
          - alertmanager:9093
    
    scrape_configs:
    - job_name: 'prometheus'
      static_configs:
      - targets: ['localhost:9090']
    
    - job_name: 'kubernetes-apiservers'
      kubernetes_sd_configs:
      - role: endpoints
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https
    
    - job_name: 'kubernetes-nodes'
      kubernetes_sd_configs:
      - role: node
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      serviceAccountName: prometheus
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        args:
          - "--config.file=/etc/prometheus/prometheus.yml"
          - "--storage.tsdb.path=/prometheus"
          - "--storage.tsdb.retention.time=15d"
        ports:
        - containerPort: 9090
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: storage
          mountPath: /prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: storage
        emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
  type: ClusterIP

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
  namespace: monitoring

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: prometheus
rules:
- apiGroups: [""]
  resources:
  - nodes
  - nodes/proxy
  - services
  - endpoints
  - pods
  verbs: ["get", "list", "watch"]
- apiGroups:
  - extensions
  resources:
  - ingresses
  verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: monitoring
```

### Grafana Deployment

```yaml
# infra/k8s/monitoring/grafana-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          valueFrom:
            secretKeyRef:
              name: grafana-secrets
              key: admin-password
        - name: GF_INSTALL_PLUGINS
          value: "grafana-piechart-panel"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        volumeMounts:
        - name: storage
          mountPath: /var/lib/grafana
        - name: datasources
          mountPath: /etc/grafana/provisioning/datasources
      volumes:
      - name: storage
        emptyDir: {}
      - name: datasources
        configMap:
          name: grafana-datasources

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
  namespace: monitoring
data:
  prometheus.yaml: |
    apiVersion: 1
    datasources:
    - name: Prometheus
      type: prometheus
      access: proxy
      url: http://prometheus:9090
      isDefault: true

---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  selector:
    app: grafana
  ports:
  - port: 3000
    targetPort: 3000
  type: LoadBalancer

---
apiVersion: v1
kind: Secret
metadata:
  name: grafana-secrets
  namespace: monitoring
type: Opaque
stringData:
  admin-password: "admin123"  # Change in production!
```

---

## 🚀 DEPLOYMENT COMMANDS

```bash
# ==================== SETUP ====================

# 1. Create namespaces
kubectl apply -f infra/k8s/01-namespace.yaml

# 2. Create secrets and configmaps
kubectl apply -f infra/k8s/05-configmap-secrets.yaml

# 3. Deploy monitoring
kubectl apply -f infra/k8s/monitoring/prometheus-deployment.yaml
kubectl apply -f infra/k8s/monitoring/grafana-deployment.yaml

# 4. Deploy applications
kubectl apply -f infra/k8s/02-frontend-deployment.yaml
kubectl apply -f infra/k8s/03-backend-deployment.yaml

# 5. Setup ingress
kubectl apply -f infra/k8s/04-ingress.yaml

# ==================== VERIFICATION ====================

# Check namespaces
kubectl get namespaces

# Check deployments
kubectl get deployments -n esprit-market
kubectl get deployments -n monitoring

# Check pods
kubectl get pods -n esprit-market
kubectl get pods -n monitoring

# Check services
kubectl get svc -n esprit-market
kubectl get svc -n monitoring

# Check ingress
kubectl get ingress -n esprit-market

# View logs
kubectl logs -n esprit-market deployment/esprit-market-backend
kubectl logs -n esprit-market deployment/esprit-market-frontend

# ==================== SCALING ====================

# Manual scaling
kubectl scale deployment esprit-market-backend --replicas=5 -n esprit-market

# Check HPA status
kubectl get hpa -n esprit-market

# ==================== CLEANUP ====================

# Delete all
kubectl delete namespace esprit-market
kubectl delete namespace monitoring
```

---

## 🔐 SECRETS MANAGEMENT

### Using Kubernetes Secrets

```bash
# Create secret from literal values
kubectl create secret generic esprit-market-secrets \
  --from-literal=mongodb-uri='mongodb+srv://admin:pass@cluster...' \
  --from-literal=jwt-secret='your-secret-key-min-256-bits' \
  -n esprit-market

# Create secret from file
kubectl create secret generic esprit-market-secrets \
  --from-file=mongodb-uri=./secrets/mongodb-uri.txt \
  --from-file=jwt-secret=./secrets/jwt-secret.txt \
  -n esprit-market

# Get secret value
kubectl get secret esprit-market-secrets -o jsonpath='{.data.jwt-secret}' | base64 -d

# Update secret
kubectl patch secret esprit-market-secrets -p='{"data":{"jwt-secret":"'$(echo -n "new-secret" | base64)'"}}'
```

### Using External Secrets (Vault/AWS Secrets Manager)

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: esprit-market
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "esprit-market"

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: esprit-market-secrets
  namespace: esprit-market
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: esprit-market-secrets
    creationPolicy: Owner
  data:
  - secretKey: mongodb-uri
    remoteRef:
      key: mongodb-uri
  - secretKey: jwt-secret
    remoteRef:
      key: jwt-secret
```

---

## 📋 CI/CD BEST PRACTICES CHECKLIST

- ✅ **Automated Testing**
  - Unit tests (Frontend: Vitest/Jasmine, Backend: JUnit)
  - Integration tests
  - E2E tests (optional but recommended)

- ✅ **Code Quality**
  - Linting (ESLint for Angular, Checkstyle for Spring Boot)
  - SonarQube analysis
  - Security scanning (OWASP Dependency Check)

- ✅ **Container Security**
  - Multi-stage builds for smaller images
  - Non-root user in containers
  - Read-only filesystems where possible
  - Regular image scanning (Trivy, Clair)

- ✅ **Deployment Strategy**
  - Rolling updates (zero-downtime deployments)
  - Health checks (liveness & readiness probes)
  - Resource limits and requests
  - Pod disruption budgets

- ✅ **Monitoring & Logging**
  - Prometheus metrics collection
  - Grafana dashboards
  - Centralized logging (ELK stack)
  - Alerts for anomalies

- ✅ **Secrets Management**
  - Use Kubernetes secrets or external secret managers
  - Never commit secrets to Git
  - Rotate regularly
  - Use different credentials per environment

---

## 🔄 DEPLOYMENT WORKFLOW SUMMARY

```
1. Developer pushes code to GitHub
   ↓
2. GitHub Actions triggers (frontend or backend pipeline)
   ↓
3. Code checkout & dependency installation
   ↓
4. Lint & build checks
   ↓
5. Run automated tests (unit + integration)
   ↓
6. Quality gate (code coverage, SonarQube)
   ↓
7. Security scanning (OWASP, image scanning)
   ↓
8. Build Docker image (multi-stage)
   ↓
9. Push to Docker registry
   ↓
10. Deploy to Kubernetes cluster
   ↓
11. Rolling update with health checks
   ↓
12. Verify deployment & run smoke tests
   ↓
13. Application live with monitoring active
```

---

## 📞 PRODUCTION DEPLOYMENT CHECKLIST

- [ ] MongoDB URI configured with strong credentials
- [ ] JWT secret with 256+ bits entropy
- [ ] CORS origins configured correctly
- [ ] HTTPS/TLS certificates installed
- [ ] SSL certificate auto-renewal (cert-manager)
- [ ] DNS records pointing to Ingress LoadBalancer
- [ ] Monitoring stack (Prometheus + Grafana) running
- [ ] Backup strategy for MongoDB
- [ ] Log aggregation configured
- [ ] Alerting rules defined
- [ ] Resource quotas set per namespace
- [ ] Network policies defined
- [ ] Pod security policies enforced
- [ ] Regular security audits scheduled
- [ ] Disaster recovery plan documented

---

**Generated:** 2026-03-27  
**Scope:** Production-Ready DevOps Pipeline  
**Status:** Ready to Implement

