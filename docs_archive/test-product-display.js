// 🧪 Product Display Test Script
// Copy-paste this entire script into your browser console (F12)
// Run it AFTER adding a product to diagnose the issue

(async function testProductDisplay() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 PRODUCT DISPLAY DIAGNOSTIC TEST');
  console.log('═══════════════════════════════════════════════════\n');

  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.error('❌ No auth token found in localStorage');
    console.log('💡 Please login first');
    return;
  }
  
  console.log('✅ Auth token found:', token.substring(0, 20) + '...\n');

  // Test 1: Check if backend is running
  console.log('📡 TEST 1: Checking backend connection...');
  try {
    const healthCheck = await fetch('http://localhost:8090/api/products/all', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', healthCheck.status, healthCheck.statusText);
    
    if (healthCheck.status === 401 || healthCheck.status === 403) {
      console.error('❌ Authentication failed - Token may be expired or user lacks ADMIN role');
      console.log('💡 Try logging out and logging back in');
      return;
    }
    
    if (!healthCheck.ok) {
      console.error('❌ Backend returned error:', healthCheck.status);
      return;
    }
    
    console.log('✅ Backend is responding\n');
    
    // Test 2: Get all products
    console.log('📡 TEST 2: Fetching all products...');
    const products = await healthCheck.json();
    
    console.log('   Total products in MongoDB:', products.length);
    console.log('   Products:', products);
    
    if (products.length === 0) {
      console.warn('⚠️  No products found in database');
      console.log('💡 Try adding a product first');
      return;
    }
    
    console.log('✅ Products retrieved successfully\n');
    
    // Test 3: Analyze products
    console.log('📊 TEST 3: Analyzing products...');
    const statusCounts = products.reduce((acc, p) => {
      acc[p.status || 'UNKNOWN'] = (acc[p.status || 'UNKNOWN'] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   Status breakdown:', statusCounts);
    console.log('   - PENDING:', statusCounts.PENDING || 0);
    console.log('   - APPROVED:', statusCounts.APPROVED || 0);
    console.log('   - REJECTED:', statusCounts.REJECTED || 0);
    
    // Test 4: Show latest product
    console.log('\n📦 TEST 4: Latest product details...');
    const latest = products[products.length - 1];
    console.log('   ID:', latest.id);
    console.log('   Name:', latest.name);
    console.log('   Price:', latest.price, 'TND');
    console.log('   Stock:', latest.stock);
    console.log('   Status:', latest.status);
    console.log('   Shop ID:', latest.shopId);
    console.log('   Category IDs:', latest.categoryIds);
    
    // Test 5: Check Angular component state
    console.log('\n🔍 TEST 5: Angular component check...');
    console.log('💡 Open Angular DevTools and check:');
    console.log('   1. Find ProductsAdminComponent in component tree');
    console.log('   2. Check products() signal value');
    console.log('   3. Compare with API response above');
    console.log('   4. If they match → Template binding issue');
    console.log('   5. If they differ → Signal update issue');
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ DIAGNOSTIC COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📋 SUMMARY:');
    console.log(`   - Backend: ${healthCheck.ok ? '✅ Working' : '❌ Not working'}`);
    console.log(`   - Products in DB: ${products.length}`);
    console.log(`   - Latest product: ${latest.name} (${latest.status})`);
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. If products are in API response but not in table:');
    console.log('      → Click "🔄 Refresh" button manually');
    console.log('      → Check Angular DevTools component state');
    console.log('   2. If products not in API response:');
    console.log('      → Check backend logs for errors');
    console.log('      → Verify MongoDB connection');
    console.log('   3. If still not working:');
    console.log('      → Share these logs with developer');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    console.log('\n💡 Possible issues:');
    console.log('   - Backend not running on port 8090');
    console.log('   - CORS issue');
    console.log('   - Network connectivity problem');
  }
})();
