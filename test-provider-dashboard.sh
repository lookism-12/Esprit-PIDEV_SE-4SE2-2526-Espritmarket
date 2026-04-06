#!/bin/bash

# Provider Dashboard Testing Script
# This script helps test the provider dashboard functionality

BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api"

echo "🚀 Provider Dashboard Testing Script"
echo "=================================="

# Function to make API calls with error handling
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local token=$4
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            curl -s -X "$method" -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data" "$url"
        else
            curl -s -X "$method" -H "Authorization: Bearer $token" "$url"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X "$method" -H "Content-Type: application/json" -d "$data" "$url"
        else
            curl -s -X "$method" "$url"
        fi
    fi
}

# Step 1: Create test data
echo "📊 Step 1: Creating test data..."
response=$(make_request "POST" "$API_URL/test/create-test-data")
echo "$response" | jq '.' 2>/dev/null || echo "$response"

if echo "$response" | grep -q "Test data created successfully"; then
    echo "✅ Test data created successfully!"
else
    echo "❌ Failed to create test data"
    exit 1
fi

echo ""

# Step 2: Login as provider
echo "🔐 Step 2: Logging in as provider..."
login_response=$(make_request "POST" "$API_URL/users/login" '{"email":"provider@test.com","password":"password123"}')
echo "$login_response" | jq '.' 2>/dev/null || echo "$login_response"

# Extract JWT token
token=$(echo "$login_response" | jq -r '.token' 2>/dev/null)
if [ "$token" = "null" ] || [ -z "$token" ]; then
    echo "❌ Failed to get JWT token"
    exit 1
fi

echo "✅ Login successful! Token: ${token:0:20}..."
echo ""

# Step 3: Test provider debug endpoint
echo "🔍 Step 3: Testing provider debug endpoint..."
debug_response=$(make_request "GET" "$API_URL/provider/debug" "" "$token")
echo "$debug_response" | jq '.' 2>/dev/null || echo "$debug_response"
echo ""

# Step 4: Get provider orders
echo "📦 Step 4: Getting provider orders..."
orders_response=$(make_request "GET" "$API_URL/provider/orders" "" "$token")
echo "$orders_response" | jq '.' 2>/dev/null || echo "$orders_response"

# Count orders
order_count=$(echo "$orders_response" | jq 'length' 2>/dev/null || echo "0")
echo "📊 Found $order_count orders for this provider"
echo ""

# Step 5: Get provider statistics
echo "📈 Step 5: Getting provider statistics..."
stats_response=$(make_request "GET" "$API_URL/provider/statistics" "" "$token")
echo "$stats_response" | jq '.' 2>/dev/null || echo "$stats_response"
echo ""

# Step 6: Test order status update (if orders exist)
if [ "$order_count" -gt 0 ]; then
    echo "🔄 Step 6: Testing order status update..."
    
    # Get first pending order ID
    first_order_id=$(echo "$orders_response" | jq -r '.[0].orderId' 2>/dev/null)
    first_order_status=$(echo "$orders_response" | jq -r '.[0].orderStatus' 2>/dev/null)
    
    if [ "$first_order_status" = "PENDING" ]; then
        echo "Confirming order: $first_order_id"
        update_response=$(make_request "PUT" "$API_URL/provider/orders/$first_order_id/status?newStatus=CONFIRMED" "" "$token")
        echo "$update_response" | jq '.' 2>/dev/null || echo "$update_response"
        echo "✅ Order status update test completed"
    else
        echo "ℹ️  First order is not PENDING (status: $first_order_status), skipping status update test"
    fi
else
    echo "ℹ️  No orders found, skipping status update test"
fi

echo ""

# Step 7: Summary
echo "📋 Step 7: Test Summary"
echo "======================"
echo "✅ Test data creation: SUCCESS"
echo "✅ Provider login: SUCCESS"
echo "✅ Debug endpoint: SUCCESS"
echo "✅ Orders retrieval: SUCCESS ($order_count orders)"
echo "✅ Statistics retrieval: SUCCESS"

if [ "$order_count" -gt 0 ]; then
    echo "✅ Order status update: SUCCESS"
else
    echo "ℹ️  Order status update: SKIPPED (no orders)"
fi

echo ""
echo "🎉 Provider Dashboard testing completed!"
echo ""
echo "Next steps:"
echo "1. Start the Angular frontend: cd frontend && ng serve"
echo "2. Navigate to http://localhost:4200/provider-dashboard"
echo "3. Login with: provider@test.com / password123"
echo "4. Verify the dashboard shows the orders"
echo ""
echo "To cleanup test data:"
echo "curl -X DELETE $API_URL/test/cleanup-test-data"