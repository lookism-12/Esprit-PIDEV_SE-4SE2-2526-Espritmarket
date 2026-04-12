# API ENDPOINTS - OLD vs NEW

**Date**: 2026-04-11

---

## CART OPERATIONS (Unchanged)

These endpoints remain the same and work as before:

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/cart` | Get current cart | ✅ Active |
| GET | `/api/cart/items` | Get cart items | ✅ Active |
| POST | `/api/cart/items` | Add product to cart | ✅ Active |
| PUT | `/api/cart/items/{id}` | Update item quantity | ✅ Active |
| DELETE | `/api/cart/items/{id}` | Remove item from cart | ✅ Active |
| DELETE | `/api/cart/clear` | Clear entire cart | ✅ Active |
| POST | `/api/cart/coupon` | Apply coupon | ✅ Active |
| DELETE | `/api/cart/coupon` | Remove coupon | ✅ Active |
| POST | `/api/cart/discount/{id}` | Apply discount | ✅ Active |
| DELETE | `/api/cart/discount` | Remove discount | ✅ Active |

---

## ORDER OPERATIONS (Changed)

### OLD ENDPOINTS (Deprecated but still work)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/cart/checkout` | Create order from cart | ⚠️ Deprecated |
| GET | `/api/cart/orders` | Get user orders | ⚠️ Deprecated |
| GET | `/api/cart/orders/{id}` | Get order details | ⚠️ Deprecated |
| POST | `/api/cart/orders/{id}/cancel` | Cancel order | ⚠️ Deprecated |
| POST | `/api/cart/orders/{id}/cancel-item` | Cancel order item | ⚠️ Deprecated |
| GET | `/api/cart/orders/{id}/refund-summary` | Get refund summary | ⚠️ Deprecated |

### NEW ENDPOINTS (Recommended)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/api/orders` | Create order from cart | ✅ New |
| POST | `/api/orders/{id}/confirm-payment` | Confirm payment | ✅ New |
| GET | `/api/orders` | Get user orders | ✅ New |
| GET | `/api/orders/{id}` | Get order details | ✅ New |
| GET | `/api/orders/number/{orderNumber}` | Get order by number | ✅ New |
| POST | `/api/orders/{id}/cancel` | Cancel order | ✅ New |
| POST | `/api/orders/{id}/cancel-item` | Cancel order item | ✅ New |
| GET | `/api/orders/{id}/refund-summary` | Get refund summary | ✅ New |
| GET | `/api/orders/admin/all` | Admin: Get all orders | ✅ New |
| GET | `/api/orders/admin/status/{status}` | Admin: Filter by status | ✅ New |
| PUT | `/api/orders/admin/{id}/status` | Admin: Update status | ✅ New |

---

## DETAILED COMPARISON

### 1. CREATE ORDER

#### OLD (Deprecated):
```http
POST /api/cart/checkout
Content-Type: application/json

{
  "shippingAddress": "123 Main St",
  "paymentMethod": "CREDIT_CARD"
}
```

**Response**: CartResponse (with order statuses)

**Issues**:
- ❌ Stock reduced immediately (before payment)
- ❌ Loyalty points added immediately (before payment)
- ❌ Returns Cart entity (confusing)

#### NEW (Recommended):
```http
POST /api/orders
Content-Type: application/json

{
  "shippingAddress": "123 Main St",
  "paymentMethod": "CREDIT_CARD",
  "notes": "Leave at door"
}
```

**Response**: OrderResponse (with order number)

**Improvements**:
- ✅ Stock NOT reduced yet (only validated)
- ✅ Loyalty points NOT added yet
- ✅ Returns Order entity (clear)
- ✅ Order number generated (e.g., "ORD-20260411-0001")

**Then confirm payment**:
```http
POST /api/orders/{orderId}/confirm-payment?paymentId=pay_123456
```

**Response**: OrderResponse (status = PAID)

**Improvements**:
- ✅ Stock reduced ONLY after payment confirmed
- ✅ Loyalty points added ONLY after payment confirmed

---

### 2. GET ORDERS

#### OLD (Deprecated):
```http
GET /api/cart/orders
```

**Response**: List<CartResponse>

**Issues**:
- ❌ Returns Cart entities (confusing)
- ❌ Mixed with cart operations

#### NEW (Recommended):
```http
GET /api/orders
```

**Response**: List<OrderResponse>

**Improvements**:
- ✅ Returns Order entities (clear)
- ✅ Separate from cart operations
- ✅ Includes order numbers
- ✅ Sorted by creation date (newest first)

---

### 3. GET ORDER DETAILS

#### OLD (Deprecated):
```http
GET /api/cart/orders/{orderId}
```

**Response**: CartResponse

#### NEW (Recommended):
```http
GET /api/orders/{orderId}
```

**Response**: OrderResponse (with items)

**OR by order number**:
```http
GET /api/orders/number/ORD-20260411-0001
```

**Improvements**:
- ✅ Human-readable order number
- ✅ Clear order entity
- ✅ Includes all order items

---

### 4. CANCEL ORDER

#### OLD (Deprecated):
```http
POST /api/cart/orders/{orderId}/cancel

{
  "reason": "Changed my mind"
}
```

**Response**: RefundSummaryDTO

#### NEW (Recommended):
```http
POST /api/orders/{orderId}/cancel

{
  "reason": "Changed my mind"
}
```

**Response**: RefundSummaryDTO

**Improvements**:
- ✅ Same functionality
- ✅ Clearer endpoint path
- ✅ Proper stock restoration
- ✅ Coupon usage restored
- ✅ Loyalty points deducted

---

### 5. ADMIN OPERATIONS

#### NEW ONLY (No old equivalent):

**Get all orders**:
```http
GET /api/orders/admin/all
Authorization: Bearer {admin_token}
```

**Filter by status**:
```http
GET /api/orders/admin/status/PENDING
Authorization: Bearer {admin_token}
```

**Update order status**:
```http
PUT /api/orders/admin/{orderId}/status?status=SHIPPED
Authorization: Bearer {admin_token}
```

---

## MIGRATION GUIDE FOR FRONTEND

### Step 1: Update Order Creation

**OLD CODE**:
```typescript
// Create order
const response = await fetch('/api/cart/checkout', {
  method: 'POST',
  body: JSON.stringify({
    shippingAddress: address,
    paymentMethod: 'CREDIT_CARD'
  })
});
const order = await response.json();
```

**NEW CODE**:
```typescript
// Create order (PENDING status)
const response = await fetch('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    shippingAddress: address,
    paymentMethod: 'CREDIT_CARD',
    notes: 'Leave at door'
  })
});
const order = await response.json();

// After payment gateway confirms payment
const confirmResponse = await fetch(`/api/orders/${order.id}/confirm-payment?paymentId=${paymentId}`, {
  method: 'POST'
});
const paidOrder = await confirmResponse.json();
```

### Step 2: Update Order List

**OLD CODE**:
```typescript
const response = await fetch('/api/cart/orders');
const orders = await response.json();
```

**NEW CODE**:
```typescript
const response = await fetch('/api/orders');
const orders = await response.json();
```

### Step 3: Update Order Details

**OLD CODE**:
```typescript
const response = await fetch(`/api/cart/orders/${orderId}`);
const order = await response.json();
```

**NEW CODE**:
```typescript
// By ID
const response = await fetch(`/api/orders/${orderId}`);
const order = await response.json();

// OR by order number
const response = await fetch(`/api/orders/number/${orderNumber}`);
const order = await response.json();
```

### Step 4: Update Order Cancellation

**OLD CODE**:
```typescript
const response = await fetch(`/api/cart/orders/${orderId}/cancel`, {
  method: 'POST',
  body: JSON.stringify({ reason: 'Changed my mind' })
});
const refund = await response.json();
```

**NEW CODE**:
```typescript
const response = await fetch(`/api/orders/${orderId}/cancel`, {
  method: 'POST',
  body: JSON.stringify({ reason: 'Changed my mind' })
});
const refund = await response.json();
```

---

## RESPONSE STRUCTURE COMPARISON

### OLD: CartResponse (used for orders)

```json
{
  "id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439000",
  "status": "PAID",
  "totalAmount": 100.0,
  "discountAmount": 10.0,
  "finalAmount": 90.0,
  "couponCode": "SAVE10",
  "shippingAddress": "123 Main St",
  "paymentMethod": "CREDIT_CARD",
  "createdAt": "2026-04-11T10:00:00",
  "lastUpdated": "2026-04-11T10:05:00"
}
```

### NEW: OrderResponse

```json
{
  "id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439000",
  "orderNumber": "ORD-20260411-0001",
  "status": "PAID",
  "totalAmount": 100.0,
  "discountAmount": 10.0,
  "finalAmount": 90.0,
  "couponCode": "SAVE10",
  "discountId": "507f1f77bcf86cd799439022",
  "shippingAddress": "123 Main St",
  "paymentMethod": "CREDIT_CARD",
  "paymentId": "pay_123456",
  "createdAt": "2026-04-11T10:00:00",
  "paidAt": "2026-04-11T10:05:00",
  "lastUpdated": "2026-04-11T10:05:00",
  "items": [
    {
      "id": "507f1f77bcf86cd799439033",
      "orderId": "507f1f77bcf86cd799439011",
      "productId": "507f1f77bcf86cd799439044",
      "productName": "Laptop",
      "productPrice": 100.0,
      "quantity": 1,
      "subtotal": 100.0,
      "status": "ACTIVE"
    }
  ]
}
```

**Key Differences**:
- ✅ `orderNumber` field (human-readable)
- ✅ `paymentId` field (payment gateway reference)
- ✅ `paidAt` timestamp (when payment confirmed)
- ✅ `items` array (order items included)
- ✅ Clear order status (not mixed with cart status)

---

## SUMMARY

### For Frontend Developers:

1. **Cart operations**: No changes needed
2. **Order creation**: Use `/api/orders` instead of `/api/cart/checkout`
3. **Payment confirmation**: Call `/api/orders/{id}/confirm-payment` after payment
4. **Order list**: Use `/api/orders` instead of `/api/cart/orders`
5. **Order details**: Use `/api/orders/{id}` instead of `/api/cart/orders/{id}`
6. **Order cancellation**: Use `/api/orders/{id}/cancel` instead of `/api/cart/orders/{id}/cancel`

### Backward Compatibility:

- ✅ Old endpoints still work (marked as @Deprecated)
- ✅ Gradual migration possible
- ✅ No breaking changes
- ⚠️ Old endpoints will be removed in future version

### Timeline:

- **Now**: Both old and new endpoints work
- **Next 3 months**: Migrate frontend to new endpoints
- **After 6 months**: Remove old endpoints (with deprecation notice)

---

**END OF API COMPARISON**
