# Provider Product Isolation - Test Guide

## 🧪 Quick Test Steps

### Prerequisites
1. Backend running on `http://localhost:8089`
2. Frontend running on `http://localhost:4200`
3. At least 2 provider accounts with different shops
4. Each provider has created some products

---

## Test Scenario 1: Provider Dashboard Isolation

### Setup
Create test data:
- **Provider A**: email: `provider1@test.com`, Shop: "Shop A"
  - Product 1: "Product A1"
  - Product 2: "Product A2"
  
- **Provider B**: email: `provider2@test.com`, Shop: "Shop B"
  - Product 3: "Product B1"
  - Product 4: "Product B2"
  - Product 5: "Product B3"

### Test Steps

#### Step 1: Login as Provider A
1. Go to `http://localhost:4200/login`
2. Login with Provider A credentials
3. Navigate to Provider Dashboard
4. Click on "Products" tab

**Expected Result**: 
- ✅ Shows ONLY 2 products (Product A1, Product A2)
- ❌ Does NOT show Product B1, B2, B3

**Console Check**:
```
📦 ProductService: Fetching provider's own products from /api/products/mine
✅ ProductService: Received 2 products for provider's shop
```

---

#### Step 2: Login as Provider B
1. Logout
2. Login with Provider B credentials
3. Navigate to Provider Dashboard
4. Click on "Products" tab

**Expected Result**:
- ✅ Shows ONLY 3 products (Product B1, B2, B3)
- ❌ Does NOT show Product A1, A2

**Console Check**:
```
📦 ProductService: Fetching provider's own products from /api/products/mine
✅ ProductService: Received 3 products for provider's shop
```

---

## Test Scenario 2: Marketplace Visibility

### Test Steps

#### Step 1: Public Marketplace View
1. Logout (or open incognito window)
2. Go to `http://localhost:4200/marketplace` or home page
3. Browse products

**Expected Result**:
- ✅ Shows ALL 5 products (A1, A2, B1, B2, B3)
- ✅ Can filter and search across all shops
- ✅ No restrictions on viewing

---

## Test Scenario 3: Security Validation

### Test Steps

#### Step 1: Try to Edit Another Provider's Product
1. Login as Provider A
2. Open browser DevTools → Network tab
3. Try to edit Product B1 (from Provider B)
4. Watch the API call

**Expected Result**:
- ❌ API returns 403 Forbidden
- ❌ Edit operation blocked by backend

**API Call**:
```
PUT /api/products/{productB1Id}
Response: 403 Forbidden
```

---

#### Step 2: Try to Access Wrong Endpoint
1. Login as Provider A
2. Open browser console
3. Manually call: `productService.getAll()`
4. Check what's returned

**Expected Result**:
- ✅ Returns all APPROVED products (public endpoint)
- ℹ️ This is correct - public endpoint remains public
- ℹ️ Dashboard uses `/mine` endpoint for isolation

---

## Test Scenario 4: Empty State

### Test Steps

#### Step 1: New Provider with No Products
1. Create a new provider account
2. Login and go to Provider Dashboard
3. Click on "Products" tab

**Expected Result**:
- ✅ Shows empty state message
- ✅ Message: "No Products in Your Shop Yet"
- ✅ Clarification: "Products from other shops are not shown here"
- ✅ "Add Product" button visible

---

## 🔍 Debugging Checklist

If tests fail, check:

### Backend
1. **Check logs** for authentication:
   ```
   Finding products for shop ID: {shopId}
   Found X products for shop ID: {shopId}
   ```

2. **Verify shop ownership**:
   ```sql
   db.shops.findOne({ownerId: ObjectId("userId")})
   ```

3. **Verify product shopId**:
   ```sql
   db.products.find({shopId: ObjectId("shopId")})
   ```

### Frontend
1. **Check console** for API calls:
   ```
   📦 ProductService: Fetching provider's own products from /api/products/mine
   ```

2. **Check Network tab**:
   - Request URL: `/api/products/mine`
   - Authorization header present
   - Response contains only provider's products

3. **Check component state**:
   ```typescript
   console.log('Products loaded:', this.products());
   ```

---

## ✅ Success Criteria

All tests pass if:
- ✅ Provider A sees only their products
- ✅ Provider B sees only their products
- ✅ Public marketplace shows all products
- ✅ Edit/delete operations validate ownership
- ✅ Empty state displays correctly
- ✅ No console errors
- ✅ No 403/500 errors in Network tab

---

## 🐛 Common Issues

### Issue 1: Provider sees all products
**Cause**: Frontend still calling `getAll()` instead of `getMyProducts()`
**Fix**: Check `provider-dashboard.ts` line ~110

### Issue 2: 403 Forbidden on /mine endpoint
**Cause**: User doesn't have PROVIDER role
**Fix**: Check user roles in database

### Issue 3: Empty products list
**Cause**: Provider doesn't have a shop
**Fix**: Create shop for provider in database

### Issue 4: Products not filtered
**Cause**: Products missing shopId field
**Fix**: Update products to include shopId

---

## 📊 Expected API Responses

### GET /api/products/mine (Provider A)
```json
[
  {
    "id": "...",
    "name": "Product A1",
    "shopId": "shopAId",
    "status": "APPROVED"
  },
  {
    "id": "...",
    "name": "Product A2",
    "shopId": "shopAId",
    "status": "PENDING"
  }
]
```

### GET /api/products (Public)
```json
[
  {
    "id": "...",
    "name": "Product A1",
    "shopId": "shopAId",
    "status": "APPROVED"
  },
  {
    "id": "...",
    "name": "Product A2",
    "shopId": "shopAId",
    "status": "APPROVED"
  },
  {
    "id": "...",
    "name": "Product B1",
    "shopId": "shopBId",
    "status": "APPROVED"
  }
]
```

---

## 🎯 Quick Verification Commands

### Check Provider's Shop
```javascript
// In MongoDB
db.users.findOne({email: "provider1@test.com"})
// Copy the _id

db.shops.findOne({ownerId: ObjectId("copiedUserId")})
// Copy the shop _id

db.products.find({shopId: ObjectId("copiedShopId")})
// Should show only provider's products
```

### Check API Endpoint
```bash
# Get JWT token from browser (DevTools → Application → Local Storage)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8089/api/products/mine
```

---

## ✅ Test Complete

If all scenarios pass, the provider product isolation is working correctly!

**Status**: 🎉 **READY FOR PRODUCTION**
