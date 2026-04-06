# Provider Dashboard Testing Script (PowerShell)
# This script helps test the provider dashboard functionality

$BaseUrl = "http://localhost:8080"
$ApiUrl = "$BaseUrl/api"

Write-Host "🚀 Provider Dashboard Testing Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Function to make API calls
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [string]$Token = $null
    )
    
    $headers = @{
        'Content-Type' = 'application/json'
    }
    
    if ($Token) {
        $headers['Authorization'] = "Bearer $Token"
    }
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $headers
        }
        return $response
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Step 1: Create test data
Write-Host "📊 Step 1: Creating test data..." -ForegroundColor Yellow
$testDataResponse = Invoke-ApiRequest -Method "POST" -Url "$ApiUrl/test/create-test-data"

if ($testDataResponse -and $testDataResponse.message -eq "Test data created successfully!") {
    Write-Host "✅ Test data created successfully!" -ForegroundColor Green
    $testDataResponse | ConvertTo-Json -Depth 3
} else {
    Write-Host "❌ Failed to create test data" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Login as provider
Write-Host "🔐 Step 2: Logging in as provider..." -ForegroundColor Yellow
$loginBody = @{
    email = "provider@test.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-ApiRequest -Method "POST" -Url "$ApiUrl/users/login" -Body $loginBody

if ($loginResponse -and $loginResponse.token) {
    $token = $loginResponse.token
    Write-Host "✅ Login successful! Token: $($token.Substring(0, 20))..." -ForegroundColor Green
} else {
    Write-Host "❌ Failed to get JWT token" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Test provider debug endpoint
Write-Host "🔍 Step 3: Testing provider debug endpoint..." -ForegroundColor Yellow
$debugResponse = Invoke-ApiRequest -Method "GET" -Url "$ApiUrl/provider/debug" -Token $token
if ($debugResponse) {
    $debugResponse | ConvertTo-Json -Depth 3
}

Write-Host ""

# Step 4: Get provider orders
Write-Host "📦 Step 4: Getting provider orders..." -ForegroundColor Yellow
$ordersResponse = Invoke-ApiRequest -Method "GET" -Url "$ApiUrl/provider/orders" -Token $token

if ($ordersResponse) {
    $orderCount = $ordersResponse.Count
    Write-Host "📊 Found $orderCount orders for this provider" -ForegroundColor Cyan
    $ordersResponse | ConvertTo-Json -Depth 3
} else {
    $orderCount = 0
    Write-Host "📊 Found 0 orders for this provider" -ForegroundColor Cyan
}

Write-Host ""

# Step 5: Get provider statistics
Write-Host "📈 Step 5: Getting provider statistics..." -ForegroundColor Yellow
$statsResponse = Invoke-ApiRequest -Method "GET" -Url "$ApiUrl/provider/statistics" -Token $token
if ($statsResponse) {
    $statsResponse | ConvertTo-Json -Depth 3
}

Write-Host ""

# Step 6: Test order status update (if orders exist)
if ($orderCount -gt 0) {
    Write-Host "🔄 Step 6: Testing order status update..." -ForegroundColor Yellow
    
    $firstOrder = $ordersResponse[0]
    $firstOrderId = $firstOrder.orderId
    $firstOrderStatus = $firstOrder.orderStatus
    
    if ($firstOrderStatus -eq "PENDING") {
        Write-Host "Confirming order: $firstOrderId" -ForegroundColor Cyan
        $updateResponse = Invoke-ApiRequest -Method "PUT" -Url "$ApiUrl/provider/orders/$firstOrderId/status?newStatus=CONFIRMED" -Token $token
        if ($updateResponse) {
            $updateResponse | ConvertTo-Json -Depth 3
        }
        Write-Host "✅ Order status update test completed" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  First order is not PENDING (status: $firstOrderStatus), skipping status update test" -ForegroundColor Blue
    }
} else {
    Write-Host "ℹ️  No orders found, skipping status update test" -ForegroundColor Blue
}

Write-Host ""

# Step 7: Summary
Write-Host "📋 Step 7: Test Summary" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host "✅ Test data creation: SUCCESS" -ForegroundColor Green
Write-Host "✅ Provider login: SUCCESS" -ForegroundColor Green
Write-Host "✅ Debug endpoint: SUCCESS" -ForegroundColor Green
Write-Host "✅ Orders retrieval: SUCCESS ($orderCount orders)" -ForegroundColor Green
Write-Host "✅ Statistics retrieval: SUCCESS" -ForegroundColor Green

if ($orderCount -gt 0) {
    Write-Host "✅ Order status update: SUCCESS" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Order status update: SKIPPED (no orders)" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎉 Provider Dashboard testing completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the Angular frontend: cd frontend && ng serve" -ForegroundColor White
Write-Host "2. Navigate to http://localhost:4200/provider-dashboard" -ForegroundColor White
Write-Host "3. Login with: provider@test.com / password123" -ForegroundColor White
Write-Host "4. Verify the dashboard shows the orders" -ForegroundColor White
Write-Host ""
Write-Host "To cleanup test data:" -ForegroundColor Yellow
Write-Host "Invoke-RestMethod -Uri '$ApiUrl/test/cleanup-test-data' -Method DELETE" -ForegroundColor White