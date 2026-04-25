#!/bin/bash

# 🧪 Loyalty Config Endpoint Test Script
# This script tests the /api/admin/loyalty-config endpoint

echo "🧪 Testing Loyalty Config Endpoint"
echo "=================================="
echo ""

# Configuration
BASE_URL="http://localhost:8080"
ADMIN_EMAIL="admin@espritmarket.com"
ADMIN_PASSWORD="admin123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if backend is running
echo "📡 Step 1: Checking if backend is running..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/login" | grep -q "200\|401\|404"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running or not accessible${NC}"
    echo "   Please start the backend with: ./mvnw spring-boot:run"
    exit 1
fi
echo ""

# Step 2: Login as admin
echo "🔐 Step 2: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

# Extract token (assuming response has "token" field)
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    # Try alternative field names
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to login as admin${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    echo ""
    echo "   Possible reasons:"
    echo "   - Admin user doesn't exist"
    echo "   - Wrong credentials"
    echo "   - Login endpoint not working"
    exit 1
else
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "   Token: ${TOKEN:0:20}..."
fi
echo ""

# Step 3: Test GET /api/admin/loyalty-config
echo "📥 Step 3: Testing GET /api/admin/loyalty-config..."
GET_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin/loyalty-config" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$GET_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$GET_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ GET request successful (200 OK)${NC}"
    echo "   Response:"
    echo "$RESPONSE_BODY" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE_BODY"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${RED}❌ Endpoint not found (404)${NC}"
    echo "   This means the controller is not registered"
    echo ""
    echo "   Troubleshooting steps:"
    echo "   1. Check if LoyaltyConfigController.java exists"
    echo "   2. Verify @RestController and @RequestMapping annotations"
    echo "   3. Restart Spring Boot application"
    echo "   4. Check application logs for errors"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠️  Unauthorized (401)${NC}"
    echo "   JWT token might be invalid or expired"
elif [ "$HTTP_CODE" = "403" ]; then
    echo -e "${YELLOW}⚠️  Forbidden (403)${NC}"
    echo "   User doesn't have ADMIN role"
else
    echo -e "${RED}❌ Unexpected response (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
fi
echo ""

# Step 4: Test POST /api/admin/loyalty-config/initialize
echo "🏗️  Step 4: Testing POST /api/admin/loyalty-config/initialize..."
INIT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/loyalty-config/initialize" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$INIT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$INIT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Initialize successful (200 OK)${NC}"
    echo "   Default configuration created"
elif [ "$HTTP_CODE" = "400" ]; then
    echo -e "${YELLOW}⚠️  Bad Request (400)${NC}"
    echo "   Configuration might already exist"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${RED}❌ Endpoint not found (404)${NC}"
else
    echo -e "${YELLOW}⚠️  Response (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Step 5: Test PUT /api/admin/loyalty-config
echo "🔧 Step 5: Testing PUT /api/admin/loyalty-config..."
UPDATE_DATA='{
  "baseRate": 0.002,
  "silverThreshold": 5000,
  "goldThreshold": 20000,
  "platinumThreshold": 50000,
  "bronzeMultiplier": 1.0,
  "silverMultiplier": 1.1,
  "goldMultiplier": 1.25,
  "platinumMultiplier": 1.5,
  "bonusQuantity": 10,
  "bonusQuantityThreshold": 10,
  "bonusHighOrder": 5,
  "bonusHighOrderThreshold": 500.0
}'

PUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/admin/loyalty-config" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA")

HTTP_CODE=$(echo "$PUT_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$PUT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ PUT request successful (200 OK)${NC}"
    echo "   Configuration updated"
elif [ "$HTTP_CODE" = "400" ]; then
    echo -e "${RED}❌ Bad Request (400)${NC}"
    echo "   Validation failed"
    echo "   Response: $RESPONSE_BODY"
elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${RED}❌ Endpoint not found (404)${NC}"
else
    echo -e "${YELLOW}⚠️  Response (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $RESPONSE_BODY"
fi
echo ""

# Summary
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo ""
echo "If all tests passed:"
echo "  ✅ Backend is working correctly"
echo "  ✅ Loyalty config endpoint is accessible"
echo "  ✅ Frontend should be able to connect"
echo ""
echo "If GET returned 404:"
echo "  ❌ Controller is not registered"
echo "  📖 See BACKEND_TROUBLESHOOTING.md for solutions"
echo ""
echo "Next steps:"
echo "  1. Start frontend: cd frontend && npm start"
echo "  2. Navigate to: http://localhost:4200/admin/platform/loyalty-system"
echo "  3. Check browser console for errors"
echo ""
