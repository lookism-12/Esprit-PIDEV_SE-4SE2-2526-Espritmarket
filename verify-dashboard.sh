#!/bin/bash
# Modern Driver Dashboard - Implementation Verification Checklist
# Run this script to verify all files are in place

echo "=================================="
echo "Driver Dashboard File Checklist"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

MISSING=0
FOUND=0

# Backend DTOs
echo "🔍 Checking Backend DTOs..."
FILES=(
  "backend/src/main/java/esprit_market/dto/DashboardDTO.java"
  "backend/src/main/java/esprit_market/dto/RideDTO.java"
  "backend/src/main/java/esprit_market/dto/BookingRequestDTO.java"
  "backend/src/main/java/esprit_market/dto/VehicleDTO.java"
  "backend/src/main/java/esprit_market/dto/ActivityDTO.java"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
    ((FOUND++))
  else
    echo -e "${RED}✗${NC} $file"
    ((MISSING++))
  fi
done

# Backend Services
echo ""
echo "🔍 Checking Backend Services..."
FILES=(
  "backend/src/main/java/esprit_market/service/carpoolingService/IDashboardService.java"
  "backend/src/main/java/esprit_market/service/carpoolingService/DashboardService.java"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
    ((FOUND++))
  else
    echo -e "${RED}✗${NC} $file"
    ((MISSING++))
  fi
done

# Backend Controllers
echo ""
echo "🔍 Checking Backend Controllers..."
FILES=(
  "backend/src/main/java/esprit_market/controller/carpoolingController/DashboardController.java"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
    ((FOUND++))
  else
    echo -e "${RED}✗${NC} $file"
    ((MISSING++))
  fi
done

# Frontend Models
echo ""
echo "🔍 Checking Frontend Models..."
FILES=(
  "frontend/src/app/front/models/dashboard.model.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
    ((FOUND++))
  else
    echo -e "${RED}✗${NC} $file"
    ((MISSING++))
  fi
done

# Frontend Services
echo ""
echo "🔍 Checking Frontend Services..."
FILES=(
  "frontend/src/app/front/core/dashboard.service.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
    ((FOUND++))
  else
    echo -e "${RED}✗${NC} $file"
    ((MISSING++))
  fi
done

# Frontend Components
echo ""
echo "🔍 Checking Frontend Components..."
FILES=(
  "frontend/src/app/front/pages/driver-dashboard/driver-dashboard.ts"
  "frontend/src/app/front/pages/driver-dashboard/driver-dashboard.html"
  "frontend/src/app/front/pages/driver-dashboard/driver-dashboard.scss"
  "frontend/src/app/front/pages/driver-dashboard/index.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
    ((FOUND++))
  else
    echo -e "${RED}✗${NC} $file"
    ((MISSING++))
  fi
done

# Routes
echo ""
echo "🔍 Checking Route Configuration..."
FILES=(
  "frontend/src/app/front/front-routing-module.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file (updated)"
    ((FOUND++))
  else
    echo -e "${RED}✗${NC} $file"
    ((MISSING++))
  fi
done

# Documentation
echo ""
echo "🔍 Checking Documentation..."
FILES=(
  "DRIVER_DASHBOARD_INTEGRATION.md"
  "DASHBOARD_SUMMARY.md"
  "ARCHITECTURE.md"
  "README_DASHBOARD.md"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
    ((FOUND++))
  else
    echo -e "${RED}✗${NC} $file"
    ((MISSING++))
  fi
done

# Summary
echo ""
echo "=================================="
echo "Verification Summary"
echo "=================================="
echo -e "Files Found: ${GREEN}$FOUND${NC}"
echo -e "Files Missing: ${RED}$MISSING${NC}"
echo ""

if [ $MISSING -eq 0 ]; then
  echo -e "${GREEN}✓ All files are in place!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Start your backend server: mvn spring-boot:run"
  echo "2. Start your frontend: npm start"
  echo "3. Navigate to: http://localhost:4200/driver-dashboard"
  echo ""
  exit 0
else
  echo -e "${RED}✗ Some files are missing!${NC}"
  echo "Please ensure all files have been created correctly."
  exit 1
fi
