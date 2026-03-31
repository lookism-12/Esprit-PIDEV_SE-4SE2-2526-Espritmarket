// 🧪 Script de Test API Produits
// Copiez-collez ce script dans la console du navigateur (F12)

console.log('🧪 Starting Product API Test...');

const token = localStorage.getItem('authToken');
const API_BASE = 'http://localhost:8090/api';

if (!token) {
  console.error('❌ No auth token found. Please login first.');
} else {
  console.log('✅ Auth token found:', token.substring(0, 20) + '...');
}

// Test 1: Get all products
console.log('\n📡 Test 1: GET /api/products/all');
fetch(`${API_BASE}/products/all`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => {
  console.log('Response status:', r.status);
  return r.json();
})
.then(products => {
  console.log('✅ Products count:', products.length);
  console.log('📦 Products:', products);
  
  if (products.length > 0) {
    console.log('🆕 Latest product:', products[products.length - 1]);
  }
})
.catch(err => console.error('❌ GET failed:', err));

// Test 2: Get all shops
console.log('\n📡 Test 2: GET /api/shops');
fetch(`${API_BASE}/shops`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(shops => {
  console.log('✅ Shops count:', shops.length);
  console.log('🏪 Shops:', shops);
  
  if (shops.length === 0) {
    console.warn('⚠️ No shops found! You need at least one shop to create products.');
  } else {
    console.log('💡 Use this shopId for testing:', shops[0].id);
  }
})
.catch(err => console.error('❌ GET shops failed:', err));

// Test 3: Get all categories
console.log('\n📡 Test 3: GET /api/categories');
fetch(`${API_BASE}/categories`, {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(categories => {
  console.log('✅ Categories count:', categories.length);
  console.log('🏷️ Categories:', categories);
})
.catch(err => console.error('❌ GET categories failed:', err));

console.log('\n✅ Test script completed. Check results above.');
