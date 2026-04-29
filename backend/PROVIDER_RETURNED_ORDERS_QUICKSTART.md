# Provider Returned Orders - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Verify Backend is Running

```bash
# Check if backend is running
curl http://localhost:8090/api/health

# Expected: 200 OK
```

### Step 2: Create Test Data

```bash
# 1. Mark a delivery as RETURNED (as driver)
curl -X PATCH "http://localhost:8090/api/deliveries/{deliveryId}/mark-returned?driverId={driverId}&reason=Customer%20absent" \
  -H "Authorization: Bearer {driver_token}"

# Expected: 200 OK with DeliveryResponseDTO
```

### Step 3: Verify Returned Orders Endpoint

```bash
# 2. Check returned orders (as provider)
curl -X GET "http://localhost:8090/api/provider/orders/returned" \
  -H "Authorization: Bearer {provider_token}"

# Expected: 200 OK with OrderResponse[]
```

### Step 4: Test Frontend

1. **Login as Provider:**
   - Open browser: `http://localhost:4200`
   - Login with provider credentials

2. **Navigate to Returned Orders:**
   - Click "Returned Orders" tab
   - Should see list of returned orders

3. **Restock an Order:**
   - Click "Verify & Restock" button
   - Confirm dialog
   - Order should disappear from list

---

## 🔍 Troubleshooting

### Issue: Empty Returned Orders List

**Check 1: Are there deliveries with status RETURNED?**
```bash
curl -X GET "http://localhost:8090/api/deliveries/status/RETURNED" \
  -H "Authorization: Bearer {token}"
```

**Check 2: Do deliveries have orderId?**
```bash
# Check delivery details
curl -X GET "http://localhost:8090/api/deliveries/{deliveryId}" \
  -H "Authorization: Bearer {token}"

# Look for: "orderId": "507f1f77bcf86cd799439011"
```

**Check 3: Do orders contain provider's products?**
```bash
# Check order details
curl -X GET "http://localhost:8090/api/orders/{orderId}" \
  -H "Authorization: Bearer {token}"

# Look for items with matching shopId
```

### Issue: 403 Forbidden

**Cause:** User doesn't have PROVIDER role

**Solution:**
```bash
# Check user roles
curl -X GET "http://localhost:8090/api/users/me" \
  -H "Authorization: Bearer {token}"

# Expected: "roles": ["ROLE_PROVIDER"]
```

### Issue: 404 Not Found

**Cause:** Endpoint doesn't exist or wrong URL

**Solution:**
```bash
# Verify correct endpoint
GET /api/provider/orders/returned  ✅
GET /api/provider/orders/return    ❌ (wrong)
GET /api/provider/returned         ❌ (wrong)
```

---

## 📋 Test Checklist

### Backend Tests

- [ ] Endpoint exists: `GET /api/provider/orders/returned`
- [ ] Returns 200 OK for valid provider
- [ ] Returns OrderResponse[] format
- [ ] Filters by Delivery.status = RETURNED
- [ ] Filters by provider's products
- [ ] Handles empty results gracefully

### Frontend Tests

- [ ] "Returned Orders" tab visible
- [ ] Tab shows badge with count
- [ ] Click tab loads orders
- [ ] Orders display correctly
- [ ] "Verify & Restock" button works
- [ ] Success toast appears
- [ ] Order removed from list

### Integration Tests

- [ ] Driver marks delivery as returned
- [ ] Provider sees order in returned tab
- [ ] Provider restocks order
- [ ] Stock restored in database
- [ ] Order status = RESTOCKED
- [ ] Order disappears from returned list

---

## 🎯 Expected Results

### Backend Response

```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "userEmail": "customer@example.com",
    "orderNumber": "ORD-2026-ABC12",
    "status": "RETURNED",
    "totalAmount": 150.00,
    "finalAmount": 135.00,
    "shippingAddress": "123 Main St",
    "paymentMethod": "CASH",
    "createdAt": "2026-04-29T10:00:00",
    "items": [
      {
        "id": "507f1f77bcf86cd799439013",
        "orderId": "507f1f77bcf86cd799439011",
        "productId": "507f1f77bcf86cd799439014",
        "productName": "Product Name",
        "productPrice": 50.00,
        "quantity": 3,
        "subtotal": 150.00,
        "status": "RETURNED"
      }
    ]
  }
]
```

### Frontend Display

```
┌─────────────────────────────────────────────────────────────┐
│ Provider Dashboard                                          │
├─────────────────────────────────────────────────────────────┤
│ [Orders] [↩️ Returned Orders (3)] [Products] [Services]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ↩️ Returned Orders - Awaiting Verification                 │
│ These orders were returned by delivery due to failed        │
│ delivery attempts. Verify the physical items and click      │
│ "Restock" to restore inventory.                            │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 📦 Order ORD-2026-ABC12                                 ││
│ │ Customer: John Doe (john@example.com)                   ││
│ │ Product: Product Name                                   ││
│ │ Quantity: 3 × 50.00 TND                                 ││
│ │ Total: 150.00 TND                                       ││
│ │                                                         ││
│ │ [✅ Verify & Restock]                                   ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Development Commands

### Backend

```bash
# Build
cd backend
mvn clean package

# Run
java -jar target/esprit-market-backend.jar

# Test endpoint
curl -X GET "http://localhost:8090/api/provider/orders/returned" \
  -H "Authorization: Bearer {token}"
```

### Frontend

```bash
# Install dependencies
cd frontend
npm install

# Run dev server
npm start

# Build for production
npm run build
```

---

## 📚 Documentation

- **Complete Guide:** `PROVIDER_RETURNED_ORDERS_IMPLEMENTATION.md`
- **Quick Summary:** `PROVIDER_RETURNED_ORDERS_SUMMARY.md`
- **Visual Diagrams:** `PROVIDER_RETURNED_ORDERS_DIAGRAM.md`
- **Architecture:** `DELIVERY_RETURN_CLEAN_ARCHITECTURE.md`

---

## ✅ Success Indicators

### Backend Logs

```
🔍 GET RETURNED ORDERS: Provider 507f1f77bcf86cd799439012
✅ Provider shop found: 507f1f77bcf86cd799439015
📦 Found 3 deliveries with status RETURNED
📋 Found 3 unique order IDs from returned deliveries
📦 Found 3 orders
✅ Order 507f1f77bcf86cd799439011 contains provider's products
✅ Returning 3 returned orders for provider
```

### Frontend Console

```
🔄 ProviderService.getReturnedOrders() called
📍 URL: http://localhost:8090/api/provider/orders/returned
✅ Returned orders response received: 3 orders
🔄 Transformed to 5 ProviderOrder objects
✅ Returned orders loaded: 5
```

### UI Indicators

- ✅ "Returned Orders" tab shows badge with count
- ✅ Orders display with customer info
- ✅ Product details show correctly
- ✅ "Verify & Restock" button is clickable
- ✅ Success toast appears after restock
- ✅ Order removed from list after restock

---

## 🎉 You're Done!

If you see:
- ✅ Returned orders displaying in provider dashboard
- ✅ "Verify & Restock" button working
- ✅ Stock restored after restock
- ✅ Order status changes to RESTOCKED

**Congratulations! The implementation is working correctly.**

---

**Last Updated:** 2026-04-29  
**Status:** ✅ READY TO USE
