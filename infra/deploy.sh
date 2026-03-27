#!/bin/bash
# ============================================
# ESPRIT MARKET - Kubernetes Deployment Script
# ============================================

set -e

echo "🚀 Deploying Esprit Market to Kubernetes..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

# Check cluster connection
echo -e "${YELLOW}📡 Checking cluster connection...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster. Check your kubeconfig.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Connected to cluster${NC}"

# Navigate to k8s directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$SCRIPT_DIR/k8s"

# Step 1: Create namespace
echo -e "${YELLOW}📦 Creating namespace...${NC}"
kubectl apply -f "$K8S_DIR/namespace.yaml"

# Step 2: Create ConfigMap and Secrets
echo -e "${YELLOW}🔐 Creating ConfigMap and Secrets...${NC}"
kubectl apply -f "$K8S_DIR/configmap-secrets.yaml"

# Step 3: Deploy Backend
echo -e "${YELLOW}🔴 Deploying Backend...${NC}"
kubectl apply -f "$K8S_DIR/backend-deployment.yaml"
kubectl apply -f "$K8S_DIR/backend-service.yaml"

# Step 4: Deploy Frontend
echo -e "${YELLOW}🔵 Deploying Frontend...${NC}"
kubectl apply -f "$K8S_DIR/frontend-deployment.yaml"
kubectl apply -f "$K8S_DIR/frontend-service.yaml"

# Step 5: Create Ingress (optional)
echo -e "${YELLOW}🌐 Creating Ingress...${NC}"
kubectl apply -f "$K8S_DIR/ingress.yaml" 2>/dev/null || echo -e "${YELLOW}⚠️ Ingress not applied (may require ingress controller)${NC}"

# Wait for deployments
echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"
kubectl rollout status deployment/esprit-market-backend -n esprit-market --timeout=120s || true
kubectl rollout status deployment/esprit-market-frontend -n esprit-market --timeout=120s || true

# Show status
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

echo -e "${YELLOW}📊 Deployment Status:${NC}"
kubectl get deployments -n esprit-market

echo ""
echo -e "${YELLOW}🔧 Services:${NC}"
kubectl get services -n esprit-market

echo ""
echo -e "${YELLOW}🐳 Pods:${NC}"
kubectl get pods -n esprit-market

echo ""
echo -e "${GREEN}To access the application:${NC}"
echo "  - Port forward frontend: kubectl port-forward svc/esprit-market-frontend 8080:80 -n esprit-market"
echo "  - Port forward backend:  kubectl port-forward svc/esprit-market-backend 8089:8089 -n esprit-market"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  - Frontend: kubectl logs -f deployment/esprit-market-frontend -n esprit-market"
echo "  - Backend:  kubectl logs -f deployment/esprit-market-backend -n esprit-market"
