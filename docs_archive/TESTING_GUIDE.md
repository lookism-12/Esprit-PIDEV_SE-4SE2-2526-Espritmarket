# 🧪 Marketplace Testing Guide

## 🚀 Quick Start

### 1. Start Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
# OR on Windows:
mvnw.cmd spring-boot:run
```

Backend will start on: **http://localhost:8090**

### 2. Frontend is Already Running
Frontend is running on: **http://localhost:4200**

---

## 📋 Pre-Test Setup

### Step 1: Login as Admin
1. Navigate to: **http://localhost:4200/login**
2. Login with admin credentials
3. You should be redirected to: **http://localhost:4200/admin/dashboard**

### Step 2: Verify Shops Exist
1. Go to: **http://localhost:4200/admin/marketplace/shop**
2. Check if any shops are listed
3. **If NO shops exist**, create one:

#### Create Shop via API (Postman/curl)
```bash
POST http://localhost:8090/api/shops
Content-Type: application/json
Authorization: Bearer <your-admin-token>

{
  "ownerId": "<valid-user-id>"
}
```

#### Or Create Shop via Browser Console
```javascript
// Get your auth token from localStorage
const token = localStorage.getItem('authToken');

// Create shop
fetch('http://localhost:8090/api/shops', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    ownerId: '<your-user-id>'  // Get from /api/users/me
  })
}).then(r => r.json()).then(console.log);
```

---

## ✅ Test Case 1: Add Product

### Steps
1. Navigate to: **http://localhost:4200/admin/marketplace/products**
2. Click **"+ Add Product"** button
3. Fill the form:
   - **Name**: `Test Laptop` *(required)*
   - **Description**: `High-performance laptop for students`
   - **Price**: `1299.99` *(required)*
   - **Stock**: `15`
   - **Shop**: Select from dropdown *(required)*
   - **Category**: Select if available
   - **Image URL**: `https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400`
4. Click **"Create"**

### Expected Results
✅ Modal closes  
✅ Product appears in table immediately  
✅ Product status shows "PENDING" (yellow badge)  
✅ Product has correct name, price, stock  
✅ Console shows: `🚀 Sending product payload: {...}`  
✅ Console shows: `✅ Product saved: {...}`  

### If It Fails
❌ Check browser console for errors  
❌ Check Network tab → POST `/api/products` → Response  
❌ Verify shop was selected  
❌ Verify backend is running  

---

## ✅ Test Case 2: Approve Product

### Steps
1. Find a product with status "PENDING"
2. Hover over the row (actions appear)
3. Click the **✅ Approve** button

### Expected Results
✅ Status changes to "APPROVED" (green badge) instantly  
✅ Approve/Reject buttons disappear  
✅ No page reload  

---

## ✅ Test Case 3: Edit Product

### Steps
1. Hover over any product row
2. Click the **✏️ Edit** button
3. Change the name to: `Updated Product Name`
4. Change price to: `999.99`
5. Click **"Update"**

### Expected Results
✅ Modal closes  
✅ Product name updates in table instantly  
✅ Product price updates in table instantly  
✅ No page reload  

---

## ✅ Test Case 4: Delete Product

### Steps
1. Hover over any product row
2. Click the **🗑️ Delete** button
3. Confirm deletion in popup

### Expected Results
✅ Product disappears from table instantly  
✅ Total count decreases  
✅ No page reload  

---

## ✅ Test Case 5: Add Service

### Steps
1. Navigate to: **http://localhost:4200/admin/marketplace/services**
2. Click **"+ Add Service"**
3. Fill the form:
   - **Name**: `Laptop Repair` *(required)*
   - **Description**: `Professional laptop repair service`
   - **Price**: `49.99` *(required)*
   - **Shop**: Select from dropdown (optional)
   - **Category**: Select if available
4. Click **"Create"**

### Expected Results
✅ Modal closes  
✅ Service appears in table immediately  
✅ Service has correct name and price  

---

## ✅ Test Case 6: Add Category

### Steps
1. Navigate to: **http://localhost:4200/admin/marketplace/categories**
2. Click **"+ Add Category"**
3. Enter name: `Electronics`
4. Click **"Create"**

### Expected Results
✅ Modal closes  
✅ Category appears in table immediately  
✅ Category shows "0 products" initially  

---

## ✅ Test Case 7: Navigation

### Steps
1. Click **Marketplace** in sidebar
2. Verify submenu expands showing:
   - Overview
   - Products
   - Categories
   - Services
   - Favorites
   - Shops
3. Click each submenu item

### Expected Results
✅ Each route loads correctly  
✅ Active item is highlighted  
✅ No 404 errors  
✅ Consistent UI across all pages  

---

## 🔍 Debugging Checklist

### Backend Issues
```bash
# Check if backend is running
curl http://localhost:8090/api/shops

# Check backend logs
cd backend
tail -f backend_run.log
```

### Frontend Issues
```javascript
// Open browser console (F12)

// Check auth token
console.log(localStorage.getItem('authToken'));

// Check current user
fetch('http://localhost:8090/api/users/me', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
}).then(r => r.json()).then(console.log);

// Check shops
fetch('http://localhost:8090/api/shops', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
}).then(r => r.json()).then(console.log);
```

### Common Issues

#### Issue: "Shop ID is mandatory"
**Solution**: Select a shop from the dropdown before submitting

#### Issue: "Shop not found"
**Solution**: Create a shop first (see Pre-Test Setup)

#### Issue: 401 Unauthorized
**Solution**: Login again, token may have expired

#### Issue: 403 Forbidden
**Solution**: Ensure user has ADMIN role in database

#### Issue: Products not appearing
**Solution**: 
1. Check Network tab → GET `/api/products/all`
2. Verify response contains products
3. Check console for errors

---

## 📊 Expected API Calls

### When Adding Product
```
1. GET /api/categories → Load categories
2. GET /api/shops → Load shops
3. GET /api/products/all → Load existing products
4. POST /api/products → Create new product
   Payload: { name, description, price, stock, shopId, categoryIds, images, status }
5. GET /api/products/all → Refresh list
```

### When Approving Product
```
1. PATCH /api/products/{id}/approve
2. GET /api/products/all → Refresh list
```

### When Deleting Product
```
1. DELETE /api/products/{id}
2. GET /api/products/all → Refresh list
```

---

## ✅ Success Criteria

All tests pass when:
- ✅ Products save to database
- ✅ Products appear in UI immediately
- ✅ All CRUD operations work
- ✅ Real-time updates work (no page reload)
- ✅ Navigation works correctly
- ✅ No console errors
- ✅ No fake success messages
- ✅ Consistent UI across all pages

---

## 🎯 Quick Verification

Run this in browser console after adding a product:
```javascript
// Should return array with your new product
fetch('http://localhost:8090/api/products/all', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
.then(r => r.json())
.then(products => {
  console.log('Total products:', products.length);
  console.log('Latest product:', products[products.length - 1]);
});
```

If you see your product in the response, **the fix is working!** ✅
