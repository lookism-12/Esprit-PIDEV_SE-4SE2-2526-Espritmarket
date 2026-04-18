# Test Provider Orders - Debugging Guide

## Issue
Provider dashboard shows 0 orders even though orders exist in the database.

## Diagnostic Steps

### Step 1: Check if you're logged in as PROVIDER
1. Open DevTools (F12)
2. Go to **Application** tab → **Local Storage** → `localhost:4200`
3. Look for `authToken` or `user` key
4. Check if the user role is `PROVIDER`

### Step 2: Test Backend Directly

Open a new terminal and run these curl commands (replace `YOUR_TOKEN` with your actual JWT token from localStorage):

```bash
# Get your auth token from browser localStorage first!
# Then test the debug endpoint:

curl -X GET "http://localhost:8090/api/provider/dashboard/debug" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

This will show you:
- Your provider ID
- Your shop ID
- All products in your shop
- All orders in the system
- All order items in the system

### Step 3: Test Orders Endpoint

```bash
curl -X GET "http://localhost:8090/api/provider/dashboard/orders" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

This should return the orders for your shop.

### Step 4: Check Browser Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for request to `/api/provider/dashboard/orders`
5. Click on it and check:
   - **Status**: Should be 200
   - **Response**: Check if it's an empty array `[]` or has data
   - **Headers**: Check if Authorization header is present

## Common Issues

### Issue 1: No Authorization Header
**Symptom**: 401 Unauthorized error
**Solution**: Check if JWT token is stored in localStorage and being sent in requests

### Issue 2: Wrong Role
**Symptom**: 403 Forbidden error
**Solution**: Make sure user has PROVIDER role, not CLIENT role

### Issue 3: No Shop Found
**Symptom**: Empty array returned, backend logs show "No shop found for provider"
**Solution**: Provider needs to create a shop first

### Issue 4: No Orders in Database
**Symptom**: Empty array returned, backend logs show "No order items found for shop"
**Solution**: Create test orders by:
1. Login as CLIENT
2. Add products to cart
3. Checkout
4. Then login as PROVIDER and check dashboard

### Issue 5: OrderItems Missing shopId
**Symptom**: Orders exist but not showing for provider
**Solution**: Check if OrderItems have shopId field populated
- Run MongoDB query: `db.orderItems.find({shopId: {$exists: false}})`
- If found, need to update existing order items with shopId

## Quick Fix: Update Existing OrderItems with shopId

If you have existing orders but OrderItems don't have shopId, run this in MongoDB:

```javascript
// Connect to MongoDB
use esprit_market

// Find all order items without shopId
db.orderItems.find({shopId: {$exists: false}}).pretty()

// For each order item, update with product's shopId
db.orderItems.find({shopId: {$exists: false}}).forEach(function(item) {
  var product = db.products.findOne({_id: item.productId});
  if (product && product.shopId) {
    db.orderItems.updateOne(
      {_id: item._id},
      {$set: {shopId: product.shopId}}
    );
    print("Updated order item " + item._id + " with shopId " + product.shopId);
  }
});
```

## Expected Backend Logs

When you load the provider dashboard, you should see these logs in backend console:

```
🔍 DEBUG: Provider ID: 67a1b2c3d4e5f6g7h8i9j0k1
🔍 DEBUG: Shop ID: 67a1b2c3d4e5f6g7h8i9j0k2
🔍 DEBUG: Provider order items count: 5
🔍 DEBUG: Orders containing provider products: 3
🔍 DEBUG: Processing order ORD-20260416-001 with 2 provider items
🔍 DEBUG: Processing order ORD-20260416-002 with 1 provider items
🔍 DEBUG: Processing order ORD-20260416-003 with 2 provider items
🔍 DEBUG: Final provider orders count: 5
```

If you see:
```
⚠️ WARNING: No shop found for provider 67a1b2c3d4e5f6g7h8i9j0k1
```
→ Provider needs to create a shop

If you see:
```
⚠️ WARNING: No order items found for shop 67a1b2c3d4e5f6g7h8i9j0k2
```
→ No orders exist for this provider's products, OR OrderItems are missing shopId field

## Next Steps

After running the diagnostic steps above, share:
1. The output of the debug endpoint
2. The output of the orders endpoint
3. The Network tab screenshot showing the request/response
4. The backend console logs

This will help identify the exact issue.
