# RETURNED Order Pickup Implementation

## Overview
This document describes the minimal implementation for handling RETURNED orders where providers must physically confirm pickup before stock is restored.

## Business Logic

### Previous Behavior (Automatic)
- Delivery marks order as RETURNED
- ❌ Stock was **automatically restored** immediately

### New Behavior (Manual Confirmation)
- Delivery marks order as RETURNED
- ✅ Stock is **NOT restored** yet
- Provider sees returned orders in dashboard
- Provider confirms physical pickup
- ✅ Stock is **restored only after confirmation**

---

## Implementation Changes

### 1. Order Entity - Added Flag
**File:** `backend/src/main/java/esprit_market/entity/cart/Order.java`

```java
// RETURNED order handling
@Builder.Default
private boolean pickedUpByProvider = false; // True when provider confirms physical pickup
```

**Purpose:** Track whether provider has physically received the returned item.

---

### 2. Service Interface - New Method
**File:** `backend/src/main/java/esprit_market/service/cartService/IOrderService.java`

```java
/**
 * Provider confirms physical pickup of returned order
 * Restores stock after provider receives the returned product
 */
OrderResponse confirmPickup(ObjectId orderId);
```

---

### 3. Service Implementation - Updated Logic
**File:** `backend/src/main/java/esprit_market/service/cartService/OrderServiceImpl.java`

#### A. Modified RETURNED Case (No Auto-Restore)
```java
case RETURNED:
    order.setReturnedAt(LocalDateTime.now());
    
    // ❌ DO NOT restore stock here - provider must confirm physical pickup first
    // Stock will be restored when provider calls confirmPickup() endpoint
    
    // Deduct loyalty points if they were granted
    if (order.getPaymentStatus() == PaymentStatus.PAID) {
        deductLoyaltyPointsForOrder(order);
    }
    
    log.info("📦 Order {} marked as RETURNED, waiting for provider pickup confirmation", 
            order.getOrderNumber());
    break;
```

#### B. New confirmPickup() Method
```java
@Override
@Transactional
public OrderResponse confirmPickup(ObjectId orderId) {
    Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    
    // Validation 1: Order must be RETURNED
    if (order.getStatus() != OrderStatus.RETURNED) {
        throw new IllegalStateException(
                String.format("Cannot confirm pickup: Order %s is not RETURNED (current status: %s)", 
                        order.getOrderNumber(), order.getStatus()));
    }
    
    // Validation 2: Prevent double pickup
    if (order.isPickedUpByProvider()) {
        throw new IllegalStateException(
                String.format("Order %s has already been picked up by provider", 
                        order.getOrderNumber()));
    }
    
    // Restore stock
    restoreStockForOrder(order);
    
    // Mark as picked up
    order.setPickedUpByProvider(true);
    order.setLastUpdated(LocalDateTime.now());
    
    Order updated = orderRepository.save(order);
    
    log.info("✅ Provider confirmed pickup for returned order {}, stock restored", 
            order.getOrderNumber());
    
    return buildOrderResponse(updated);
}
```

**Validations:**
1. Order status must be RETURNED
2. Cannot confirm pickup twice (prevents double stock restoration)

---

### 4. Controller - New Endpoints
**File:** `backend/src/main/java/esprit_market/controller/providerController/ProviderOrderController.java`

#### A. Get Returned Orders Waiting for Pickup
```java
/**
 * GET /api/provider/orders/returned
 * Returns orders with status=RETURNED and pickedUpByProvider=false
 */
@GetMapping("/returned")
public ResponseEntity<List<OrderResponse>> getReturnedOrders(Authentication authentication)
```

**Purpose:** Provider dashboard shows list of returned items waiting for pickup.

**Filters:**
- `status = RETURNED`
- `pickedUpByProvider = false`
- Contains provider's products

#### B. Confirm Pickup
```java
/**
 * POST /api/provider/orders/{orderId}/pickup
 * Provider confirms physical pickup of returned order
 */
@PostMapping("/{orderId}/pickup")
public ResponseEntity<OrderResponse> confirmPickup(
        @PathVariable String orderId,
        Authentication authentication)
```

**Purpose:** Provider clicks "Confirm Pickup" button to restore stock.

**Validations:**
- Provider must own products in the order
- Order must be RETURNED
- Cannot confirm twice

---

## API Endpoints

### 1. Get Returned Orders
```http
GET /api/provider/orders/returned
Authorization: Bearer {provider_jwt_token}
```

**Response:**
```json
[
  {
    "orderId": "69ec97193d512c6d8be33058",
    "orderNumber": "ORD-20260428-0037",
    "status": "RETURNED",
    "pickedUpByProvider": false,
    "returnedAt": "2026-04-28T15:30:00",
    "items": [...],
    "totalAmount": 220.0
  }
]
```

### 2. Confirm Pickup
```http
POST /api/provider/orders/{orderId}/pickup
Authorization: Bearer {provider_jwt_token}
```

**Success Response (200):**
```json
{
  "orderId": "69ec97193d512c6d8be33058",
  "orderNumber": "ORD-20260428-0037",
  "status": "RETURNED",
  "pickedUpByProvider": true,
  "message": "Stock restored successfully"
}
```

**Error Responses:**
- `400` - Order not RETURNED
- `400` - Already picked up
- `404` - Order not found
- `403` - Order doesn't contain provider's products

---

## Workflow Example

### Scenario: Customer orders 3 items (stock = 10)

1. **Customer orders:**
   - orderStatus = PENDING
   - stock = 10 (unchanged)

2. **Provider confirms:**
   - orderStatus = CONFIRMED
   - stock = 7 (reduced by 3)

3. **Delivery attempts delivery:**
   - orderStatus = IN_TRANSIT

4. **Delivery fails (customer not home):**
   - orderStatus = RETURNED
   - pickedUpByProvider = false
   - stock = 7 (NOT restored yet)

5. **Provider sees in dashboard:**
   - "Returned Orders" section shows this order
   - Button: "Confirm Pickup"

6. **Provider physically receives package and clicks button:**
   - POST `/api/provider/orders/{orderId}/pickup`
   - pickedUpByProvider = true
   - stock = 10 (restored)

---

## Database Schema

### Order Collection
```javascript
{
  "_id": ObjectId("..."),
  "status": "RETURNED",
  "pickedUpByProvider": false,  // NEW FIELD
  "returnedAt": ISODate("2026-04-28T15:30:00Z"),
  // ... other fields
}
```

**Index Recommendation:**
```javascript
db.orders.createIndex({ "status": 1, "pickedUpByProvider": 1 })
```

---

## Frontend Integration

### Provider Dashboard - Returned Orders Section

```typescript
// Get returned orders waiting for pickup
getReturnedOrders(): Observable<Order[]> {
  return this.http.get<Order[]>(`${this.apiUrl}/provider/orders/returned`);
}

// Confirm pickup
confirmPickup(orderId: string): Observable<Order> {
  return this.http.post<Order>(`${this.apiUrl}/provider/orders/${orderId}/pickup`, {});
}
```

### UI Component
```html
<div class="returned-orders-section">
  <h3>Returned Orders - Waiting for Pickup</h3>
  
  <div *ngFor="let order of returnedOrders" class="order-card">
    <p>Order: {{ order.orderNumber }}</p>
    <p>Returned: {{ order.returnedAt | date }}</p>
    <p>Items: {{ order.items.length }}</p>
    
    <button (click)="confirmPickup(order.orderId)" 
            class="btn-primary">
      Confirm Pickup
    </button>
  </div>
</div>
```

---

## Testing

### Test Case 1: Normal Flow
```bash
# 1. Create order and confirm (stock reduced)
# 2. Mark as RETURNED
curl -X PUT http://localhost:8090/api/orders/{orderId}/status?status=RETURNED

# 3. Verify stock NOT restored yet
# 4. Provider confirms pickup
curl -X POST http://localhost:8090/api/provider/orders/{orderId}/pickup \
  -H "Authorization: Bearer {provider_token}"

# 5. Verify stock restored
```

### Test Case 2: Prevent Double Pickup
```bash
# 1. Confirm pickup once (should succeed)
# 2. Try to confirm again (should fail with 400)
```

### Test Case 3: Wrong Status
```bash
# Try to confirm pickup on DELIVERED order (should fail with 400)
```

---

## Key Points

✅ **Minimal Change:** Only added 1 boolean flag, no complex redesign  
✅ **Validation:** Prevents double pickup and wrong status  
✅ **Stock Safety:** Stock only restored after physical confirmation  
✅ **Backward Compatible:** Existing orders work normally  
✅ **Provider Control:** Provider decides when to restore stock  

---

## Migration Notes

**Existing RETURNED orders in database:**
- Will have `pickedUpByProvider = false` (default)
- Provider should confirm pickup to restore stock
- Or admin can manually update: `db.orders.updateMany({status: "RETURNED"}, {$set: {pickedUpByProvider: true}})`

---

## Summary

This implementation ensures that stock is only restored when the provider physically receives the returned product, preventing inventory discrepancies and providing better control over the return process.
