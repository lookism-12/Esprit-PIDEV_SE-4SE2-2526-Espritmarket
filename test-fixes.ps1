# Test Script for Provider Dashboard and Marketplace Fixes
# Run this after starting your backend

$BaseUrl = "http://localhost:8080"

Write-Host "🔧 Testing Provider Dashboard and Marketplace Fixes" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Step 1: Check current data status
Write-Host "📊 Step 1: Checking current data status..." -ForegroundColor Yellow
try {
    $dataStatus = Invoke-RestMethod -Uri "$BaseUrl/api/fix/check-data" -Method GET
    Write-Host "✅ Data Status:" -ForegroundColor Green
    $dataStatus | ConvertTo-Json -Depth 2
} catch {
    Write-Host "❌ Failed to check data status: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 2: Fix existing data
Write-Host "🛠️ Step 2: Fixing existing data..." -ForegroundColor Yellow
try {
    $fixResult = Invoke-RestMethod -Uri "$BaseUrl/api/fix/fix-existing-data" -Method POST
    Write-Host "✅ Fix Result:" -ForegroundColor Green
    $fixResult | ConvertTo-Json -Depth 2
} catch {
    Write-Host "❌ Failed to fix data: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Test marketplace (approved products)
Write-Host "🛒 Step 3: Testing marketplace (approved products)..." -ForegroundColor Yellow
try {
    $approvedProducts = Invoke-RestMethod -Uri "$BaseUrl/api/products/approved" -Method GET
    Write-Host "✅ Approved Products Count: $($approvedProducts.Count)" -ForegroundColor Green
    if ($approvedProducts.Count -gt 0) {
        Write-Host "   First product: $($approvedProducts[0].name)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Failed to get approved products: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 4: Test provider login and orders
Write-Host "👤 Step 4: Testing provider login and orders..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "provider@test.com"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/users/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.token) {
        Write-Host "✅ Provider login successful" -ForegroundColor Green
        
        # Test provider orders
        $headers = @{
            'Authorization' = "Bearer $($loginResponse.token)"
        }
        
        $providerOrders = Invoke-RestMethod -Uri "$BaseUrl/api/provider/orders" -Method GET -Headers $headers
        Write-Host "✅ Provider Orders Count: $($providerOrders.Count)" -ForegroundColor Green
        
        if ($providerOrders.Count -gt 0) {
            Write-Host "   First order: Customer '$($providerOrders[0].clientName)' - Product '$($providerOrders[0].productName)'" -ForegroundColor Cyan
        }
        
        # Test provider debug
        $debugInfo = Invoke-RestMethod -Uri "$BaseUrl/api/provider/debug" -Method GET -Headers $headers
        Write-Host "✅ Provider Debug Info:" -ForegroundColor Green
        Write-Host "   Shop ID: $($debugInfo.shopId)" -ForegroundColor Cyan
        Write-Host "   Product Count: $($debugInfo.productCount)" -ForegroundColor Cyan
        Write-Host "   Total Cart Items: $($debugInfo.totalCartItemsInSystem)" -ForegroundColor Cyan
        
    } else {
        Write-Host "❌ Provider login failed - no token received" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to test provider functionality: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Step 5: Summary
Write-Host "📋 Summary" -ForegroundColor Green
Write-Host "=========" -ForegroundColor Green
Write-Host "✅ Data fix applied" -ForegroundColor Green
Write-Host "✅ Marketplace tested" -ForegroundColor Green
Write-Host "✅ Provider dashboard tested" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start Angular frontend: cd frontend && ng serve" -ForegroundColor White
Write-Host "2. Test Provider Dashboard: http://localhost:4200/provider-dashboard" -ForegroundColor White
Write-Host "3. Login with: provider@test.com / password123" -ForegroundColor White
Write-Host "4. Test Marketplace: http://localhost:4200/products" -ForegroundColor White