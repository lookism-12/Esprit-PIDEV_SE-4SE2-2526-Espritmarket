# 🔍 Browser Console Debugging Commands

Open browser DevTools (F12) → Console tab, then run these commands:

## Step 1: Check if orders loaded successfully

```javascript
// This shows what the component received
console.log('Current orders:', JSON.parse(localStorage.getItem('orders') || '[]'));
```

## Step 2: Manual API test from browser

```javascript
// Get JWT token
const token = localStorage.getItem('token');
console.log('JWT Token:', token ? 'Present ✅' : 'Missing ❌');

// Test provider orders endpoint
fetch('http://localhost:8080/api/provider/orders', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('Status:', res.status);
  return res.json();
})
.then(data => {
  console.log('📦 Orders Response:', data);
  console.log('📊 Order count:', Array.isArray(data) ? data.length : 'Not an array');
})
.catch(err => console.error('❌ Error:', err));
```

## Step 3: Test debug endpoint

```javascript
// Get detailed debug info
fetch('http://localhost:8080/api/provider/debug', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('🔍 DEBUG INFO:', data);
  console.log('-------------------');
  console.log('Provider ID:', data.providerId);
  console.log('Shop ID:', data.shopId);
  console.log('Product Count:', data.productCount);
  console.log('Product IDs:', data.productIds);
  console.log('Total Orders in System:', data.totalOrders);
  console.log('Orders:', data.orders);
  console.log('-------------------');
  
  // Analysis
  if (data.shopId === 'NOT FOUND') {
    console.error('❌ ISSUE: Provider has NO SHOP');
    console.log('💡 FIX: Create a shop for this provider in MongoDB');
  } else if (data.productCount === 0) {
    console.error('❌ ISSUE: Shop has NO PRODUCTS');
    console.log('💡 FIX: Add products to this shop in MongoDB');
  } else if (data.totalOrders === 0) {
    console.error('❌ ISSUE: NO ORDERS in the system');
    console.log('💡 FIX: Place a test order as a customer');
  } else {
    console.log('✅ Provider has shop and products');
    console.log('Checking if orders contain provider\'s products...');
    
    // Check overlap
    const providerProductIds = data.productIds || [];
    const ordersWithProviderProducts = data.orders.filter(order => {
      const orderProductIds = order.productIds || [];
      return orderProductIds.some(pid => providerProductIds.includes(pid));
    });
    
    console.log('Orders with provider\'s products:', ordersWithProviderProducts.length);
    
    if (ordersWithProviderProducts.length === 0) {
      console.error('❌ ISSUE: Orders exist but DON\'T contain provider\'s products');
      console.log('💡 FIX: Place an order with products from this shop');
      console.log('Provider products:', providerProductIds);
      console.log('Order products:', data.orders.map(o => o.productIds));
    } else {
      console.log('✅ Everything looks good!');
      console.log('Orders should be visible. Check frontend filtering.');
    }
  }
})
.catch(err => console.error('❌ Error:', err));
```

## Step 4: Check current Angular component state

```javascript
// This works if you have Angular DevTools or access to component
// Alternative: Check what the service returns
console.log('Checking provider service...');
```

## Step 5: Test statistics endpoint

```javascript
fetch('http://localhost:8080/api/provider/statistics', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('📈 STATISTICS:', data);
  console.log('Pending:', data.pendingOrders);
  console.log('Confirmed:', data.confirmedOrders);
  console.log('Cancelled:', data.cancelledOrders);
  console.log('Total:', data.totalOrders);
  console.log('Revenue:', data.totalRevenue);
})
.catch(err => console.error('❌ Error:', err));
```

---

## Quick Analysis Results

After running the debug endpoint, you should see one of these:

### Result 1: "shopId": "NOT FOUND"
**Problem:** Provider doesn't have a shop  
**Action:** Run this in MongoDB:

```javascript
// In MongoDB Shell or Compass
db.shops.insertOne({
  name: "My Shop",
  description: "Provider Shop",
  ownerId: ObjectId("PASTE_PROVIDER_ID_FROM_DEBUG"),
  productIds: [],
  createdAt: new Date()
})
```

### Result 2: "productCount": 0
**Problem:** Shop exists but has no products  
**Action:** Check if products exist elsewhere:

```javascript
// Browser console - get shop ID from debug
const shopId = 'PASTE_SHOP_ID_HERE';

// Then in MongoDB
db.products.find({}).pretty()
// If products exist, update their shopId:
db.products.updateMany(
  { /* your filter */ },
  { $set: { shopId: ObjectId("PASTE_SHOP_ID") } }
)
```

### Result 3: "totalOrders": 0
**Problem:** No orders in system  
**Action:** Place a test order:
1. Logout from provider account
2. Login as customer
3. Add product to cart
4. Complete checkout
5. Login back as provider

### Result 4: Orders exist but no match
**Problem:** Orders don't contain provider's products  
**Action:** Check productIds overlap

```javascript
// Browser console
const debug = /* paste debug response here */;
console.log('Provider products:', debug.productIds);
console.log('Order products:', debug.orders.map(o => o.productIds));
// Look for overlap - if none, place order with correct products
```

---

## Expected Console Output (Success)

When everything works, you should see:

```
📊 Loading provider orders...
✅ Orders loaded: [
  {
    orderId: "...",
    clientName: "Customer Name",
    productName: "Product Name",
    quantity: 2,
    unitPrice: 100,
    subTotal: 200,
    orderStatus: "PENDING",
    orderDate: "2026-04-05T15:00:00"
  }
]
📈 Loading statistics...
✅ Statistics loaded: {
  pendingOrders: 1,
  confirmedOrders: 0,
  cancelledOrders: 0,
  totalOrders: 1,
  totalRevenue: 0
}
```

---

## Expected Console Output (Empty but valid)

If no orders match:

```
📊 Loading provider orders...
✅ Orders loaded: []
📈 Loading statistics...
✅ Statistics loaded: {
  pendingOrders: 0,
  confirmedOrders: 0,
  cancelledOrders: 0,
  totalOrders: 0,
  totalRevenue: 0
}
```

---

## Expected Console Output (Error)

If something is wrong:

```
📊 Loading provider orders...
❌ Failed to load orders: {error message}
```

**Common error messages:**
- `401 Unauthorized` → Token expired, re-login
- `403 Forbidden` → User doesn't have PROVIDER role
- `500 Internal Server Error` → Backend issue (check backend logs)

---

## Network Tab Check

1. Open DevTools → Network tab
2. Refresh the page
3. Look for: `orders` request
4. Click on it
5. Check:
   - **Status**: Should be `200 OK`
   - **Response**: Should be JSON array
   - **Headers → Request Headers → Authorization**: Should have `Bearer ...`

If status is not 200:
- 401/403 → Authentication issue
- 500 → Backend error
- 404 → Wrong endpoint URL

---

## Copy-Paste Diagnostic

Run this all-in-one diagnostic:

```javascript
(async function diagnose() {
  console.clear();
  console.log('🔍 Provider Dashboard Diagnostic Starting...\n');
  
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ No JWT token found. Please login first.');
    return;
  }
  
  console.log('✅ JWT token present');
  console.log('📡 Fetching debug info...\n');
  
  try {
    const response = await fetch('http://localhost:8080/api/provider/debug', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status}`);
      console.log('Response:', await response.text());
      return;
    }
    
    const data = await response.json();
    
    console.log('🔍 DEBUG RESPONSE:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n------- ANALYSIS -------\n');
    
    // Analyze
    const issues = [];
    
    if (data.shopId === 'NOT FOUND') {
      issues.push('❌ Provider has NO SHOP');
      console.log('Provider ID:', data.providerId);
      console.log('💡 Create shop with: db.shops.insertOne({ name: "Shop", ownerId: ObjectId("' + data.providerId + '") })');
    } else {
      console.log('✅ Shop exists:', data.shopId);
    }
    
    if (data.productCount === 0) {
      issues.push('❌ Shop has NO PRODUCTS');
      console.log('💡 Add products to shop ID:', data.shopId);
    } else {
      console.log('✅ Shop has', data.productCount, 'products');
    }
    
    if (data.totalOrders === 0) {
      issues.push('⚠️ NO ORDERS in system');
      console.log('💡 Place a test order as customer');
    } else {
      console.log('✅ System has', data.totalOrders, 'orders');
      
      // Check overlap
      if (data.productIds && data.productIds.length > 0) {
        const providerProductIds = data.productIds;
        let matchingOrders = 0;
        
        data.orders.forEach(order => {
          const orderProductIds = order.productIds || [];
          const hasMatch = orderProductIds.some(pid => providerProductIds.includes(pid));
          if (hasMatch) matchingOrders++;
        });
        
        if (matchingOrders === 0) {
          issues.push('❌ Orders exist but DON\'T contain provider\'s products');
          console.log('💡 Place order with products:', providerProductIds);
        } else {
          console.log('✅ Found', matchingOrders, 'orders with provider\'s products');
        }
      }
    }
    
    console.log('\n------- SUMMARY -------\n');
    if (issues.length === 0) {
      console.log('✅ Everything looks good!');
      console.log('If orders still don\'t show, check:');
      console.log('1. Order status (should not be DRAFT)');
      console.log('2. Frontend filters');
      console.log('3. Browser console for API response');
    } else {
      console.log('Issues found:');
      issues.forEach(issue => console.log(issue));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

---

**Run the all-in-one diagnostic above in your browser console and share the output!**
