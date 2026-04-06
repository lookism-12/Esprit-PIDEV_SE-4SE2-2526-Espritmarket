# 🔍 Provider Orders Debugging Script

## Issue: Orders not displaying despite being sent

This script will help identify why orders aren't showing up in the provider dashboard.

---

## Step 1: Test the Debug Endpoint

**Call the debug endpoint to see provider's data:**

```bash
GET http://localhost:8080/api/provider/debug
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response:**
```json
{
  "providerId": "...",
  "providerEmail": "...",
  "shopId": "..." or "NOT FOUND",
  "productCount": X,
  "productIds": ["...", "..."],
  "totalOrders": Y,
  "orders": [
    {
      "orderId": "...",
      "status": "PENDING",
      "itemCount": Z,
      "productIds": ["...", "..."]
    }
  ]
}
```

---

## Step 2: Analyze the Response

### ❌ Case 1: shopId = "NOT FOUND"
**Problem:** Provider has no shop
**Solution:** Create a shop for this provider

**MongoDB Query to create shop:**
```javascript
db.shops.insertOne({
  name: "Provider Shop Name",
  description: "My Shop",
  ownerId: ObjectId("PROVIDER_ID_FROM_DEBUG"),
  productIds: [],
  createdAt: new Date()
})
```

---

### ❌ Case 2: productCount = 0
**Problem:** Shop has no products
**Solution:** Add products to the shop

**MongoDB Query to check products:**
```javascript
// Check if products exist
db.products.find({})

// If products exist but shopId is wrong, update them:
db.products.updateMany(
  { /* your filter */ },
  { $set: { shopId: ObjectId("SHOP_ID_FROM_DEBUG") } }
)

// Or create a new product:
db.products.insertOne({
  name: "Test Product",
  description: "Test",
  shopId: ObjectId("SHOP_ID_FROM_DEBUG"),
  price: 100,
  stock: 10,
  quantity: 10,
  status: "APPROVED",
  images: [],
  categoryIds: [],
  createdAt: new Date()
})
```

---

### ❌ Case 3: totalOrders = 0
**Problem:** No orders in the system
**Solution:** Place a test order

**Steps:**
1. Login as CLIENT (not provider)
2. Add provider's product to cart
3. Checkout and place order
4. Verify order was created

---

### ❌ Case 4: Orders exist BUT productIds don't match
**Problem:** Orders exist but don't contain provider's products

**Compare:**
- `productIds` from shop → ["product1", "product2"]
- `productIds` from orders → ["product3", "product4"]

**If they don't overlap:** Orders are for different provider's products!

**Solution:** Place an order with provider's actual products

---

## Step 3: Manual Database Check

### Check Provider's Shop
```javascript
// Find logged-in provider
db.users.findOne({ email: "provider@email.com" })
// Copy the _id

// Find provider's shop
db.shops.findOne({ ownerId: ObjectId("PROVIDER_ID") })
// Copy the shop _id
```

### Check Shop's Products
```javascript
db.products.find({ shopId: ObjectId("SHOP_ID") })
// Note all product _id values
```

### Check Orders with Those Products
```javascript
// Get all non-draft orders
db.carts.find({ 
  status: { $in: ["PENDING", "CONFIRMED", "CANCELLED", "PROCESSING", "SHIPPED", "DELIVERED"] }
})

// For each order, check its items
db.cart_items.find({ cartId: ObjectId("ORDER_ID") })

// Do any cart_items have productId matching shop's products?
db.cart_items.find({ 
  productId: { $in: [
    ObjectId("PRODUCT1_ID"),
    ObjectId("PRODUCT2_ID")
  ]}
})
```

---

## Step 4: Common Issues and Fixes

### Issue A: Product's shopId is null or wrong
```javascript
// Check products without shopId
db.products.find({ shopId: { $exists: false } })
db.products.find({ shopId: null })

// Fix: Update products with correct shopId
db.products.updateMany(
  { /* your filter, e.g., name: "..." */ },
  { $set: { shopId: ObjectId("CORRECT_SHOP_ID") } }
)
```

### Issue B: Orders are in DRAFT status
```javascript
// Check draft orders
db.carts.find({ status: "DRAFT" })

// Fix: Update to PENDING
db.carts.updateOne(
  { _id: ObjectId("ORDER_ID") },
  { $set: { status: "PENDING" } }
)
```

### Issue C: CartItems have null productId
```javascript
// Check cart items with null productId
db.cart_items.find({ productId: null })
db.cart_items.find({ productId: { $exists: false } })

// Fix: Update with correct productId
db.cart_items.updateOne(
  { _id: ObjectId("ITEM_ID") },
  { $set: { productId: ObjectId("CORRECT_PRODUCT_ID") } }
)
```

### Issue D: Provider role is wrong
```javascript
// Check user role
db.users.findOne({ email: "provider@email.com" })

// Should have role: "PROVIDER" or "SELLER"
// If not, update:
db.users.updateOne(
  { email: "provider@email.com" },
  { $set: { role: "PROVIDER" } }
)
```

---

## Step 5: Test Flow End-to-End

### Create Complete Test Data

```javascript
// 1. Create Provider User
const providerId = ObjectId();
db.users.insertOne({
  _id: providerId,
  email: "testprovider@esprit.tn",
  password: "$2a$10$...", // hash of "password123"
  firstName: "Test",
  lastName: "Provider",
  role: "PROVIDER",
  createdAt: new Date()
})

// 2. Create Shop for Provider
const shopId = ObjectId();
db.shops.insertOne({
  _id: shopId,
  name: "Test Shop",
  description: "Test Shop Description",
  ownerId: providerId,
  productIds: [],
  createdAt: new Date()
})

// 3. Create Product in Shop
const productId = ObjectId();
db.products.insertOne({
  _id: productId,
  name: "Test Product",
  description: "Test Product Description",
  shopId: shopId,
  price: 100,
  stock: 50,
  quantity: 50,
  status: "APPROVED",
  images: [],
  categoryIds: [],
  createdAt: new Date()
})

// 4. Create Customer User
const customerId = ObjectId();
db.users.insertOne({
  _id: customerId,
  email: "testcustomer@esprit.tn",
  password: "$2a$10$...",
  firstName: "Test",
  lastName: "Customer",
  role: "CLIENT",
  createdAt: new Date()
})

// 5. Create Order (Cart)
const orderId = ObjectId();
db.carts.insertOne({
  _id: orderId,
  userId: customerId,
  status: "PENDING",
  creationDate: new Date(),
  lastUpdated: new Date(),
  subtotal: 200,
  discountAmount: 0,
  taxAmount: 0,
  total: 200,
  cartItemIds: []
})

// 6. Create Cart Item
const cartItemId = ObjectId();
db.cart_items.insertOne({
  _id: cartItemId,
  cartId: orderId,
  productId: productId,
  productName: "Test Product",
  quantity: 2,
  unitPrice: 100,
  subTotal: 200,
  discountApplied: 0,
  status: "ACTIVE"
})

// 7. Update cart with cart item
db.carts.updateOne(
  { _id: orderId },
  { $push: { cartItemIds: cartItemId } }
)
```

Now:
1. Login as `testprovider@esprit.tn`
2. Go to provider dashboard
3. You should see 1 order from "Test Customer"

---

## Step 6: Frontend Console Check

Open browser DevTools (F12) and look for:

### Success Messages:
```
✅ Provider Dashboard initialized
📊 Loading provider orders...
✅ Orders loaded: [...]
📈 Loading statistics...
✅ Statistics loaded: {...}
```

### Error Messages:
```
❌ Failed to load orders: ...
❌ HTTP Error: 401/403/500
```

### Network Tab:
Check the actual API response:
1. Open Network tab
2. Refresh dashboard
3. Find request: `GET /api/provider/orders`
4. Click on it → Response tab
5. What's the actual JSON response?

**If response is `[]` (empty array):**
→ Backend is working but filtering out all orders
→ Use debug endpoint to see why

**If response is error:**
→ Check error message
→ Check backend logs

---

## Step 7: Quick Diagnostic Checklist

Run through this checklist:

```
☐ Provider user exists in database?
    db.users.findOne({ email: "..." })

☐ Provider has PROVIDER or SELLER role?
    Check: user.role === "PROVIDER" || user.role === "SELLER"

☐ Provider has a shop?
    db.shops.findOne({ ownerId: ObjectId("...") })

☐ Shop has products?
    db.products.find({ shopId: ObjectId("...") })

☐ Products have correct shopId?
    Check: product.shopId === shop._id

☐ Orders exist in database?
    db.carts.find({ status: { $ne: "DRAFT" } })

☐ Orders have cart items?
    db.cart_items.find({ cartId: ObjectId("...") })

☐ Cart items reference shop's products?
    Check: cartItem.productId IN [product1._id, product2._id, ...]

☐ JWT token is valid?
    Try login again to get fresh token

☐ Backend is running?
    Check: http://localhost:8080/actuator/health

☐ Frontend can reach backend?
    Check browser Network tab for CORS errors
```

---

## Step 8: Enable Maximum Logging

To see exactly what's happening, check backend console for these logs:

```
🔍 DEBUG: Provider ID: ...
🔍 DEBUG: Shop ID: ...
🔍 DEBUG: Provider products count: X
  - Product: ... | ...
🔍 DEBUG: Product ID strings: [...]
🔍 DEBUG: Total non-draft orders: Y
🔍 DEBUG: Order ... has Z items
  - Item product: ... | Match: true/false
🔍 DEBUG: Provider items in order: N
🔍 DEBUG: Final provider orders count: M
```

**If you don't see these logs:**
→ Request isn't reaching the controller
→ Check authentication/authorization

**If logs show "Final provider orders count: 0":**
→ Use debug endpoint to understand why filtering fails

---

## Quick Fix Commands

### Create Missing Shop
```javascript
db.shops.insertOne({
  name: "My Shop",
  ownerId: ObjectId("PASTE_PROVIDER_ID_HERE"),
  productIds: []
})
```

### Link Existing Products to Shop
```javascript
db.products.updateMany(
  { /* Add your filter, e.g., creator or name pattern */ },
  { $set: { shopId: ObjectId("PASTE_SHOP_ID_HERE") } }
)
```

### Change Order Status from DRAFT to PENDING
```javascript
db.carts.updateMany(
  { status: "DRAFT" },
  { $set: { status: "PENDING" } }
)
```

---

## Summary: Most Likely Issues

Based on "no orders displayed", the most common causes are:

1. **🔴 Provider has no shop** (60% of cases)
   - Fix: Create shop with `ownerId` = provider's `_id`

2. **🔴 Shop has no products** (25% of cases)
   - Fix: Add products with `shopId` = shop's `_id`

3. **🔴 Orders exist but products don't match** (10% of cases)
   - Fix: Ensure cart items have `productId` from provider's products

4. **🔴 Orders are in DRAFT status** (3% of cases)
   - Fix: Change status to PENDING

5. **🔴 Authentication issue** (2% of cases)
   - Fix: Re-login to get fresh JWT token

---

**Start with the debug endpoint - it will tell you exactly what's wrong!**

```bash
GET http://localhost:8080/api/provider/debug
```

Then follow the relevant fix from this guide.
