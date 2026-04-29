# RESTOCKED Status Implementation

## Overview
Minimal extension to order workflow to support proper RETURNED order verification and RESTOCK processing.

## Business Logic

### Problem with Previous Approach
- RETURNED was a final status
- Stock was automatically restored when marked RETURNED
- No provider verification step

### New Approach with RESTOCKED Status
- **RETURNED** = Package returned by delivery, waiting for provider verification
- **RESTOCKED** = Provider verified returned item and stock has been restored
- Stock restoration happens ONLY when status changes to RESTOCKED

---

## Implementation Changes

### 1. OrderStatus Enum - Added RESTOCKED
**File:** `backend/src/main/java/esprit_market/Enum/cartEnum/OrderStatus.java`

```java
public enum OrderStatus {
    PENDING,           // Order created, waiting for provider confirmation
    CONFIRMED,         // Provider accepted, ready for delivery
    PREPARING,         // Delivery accepted, preparing package
    IN_TRANSIT,        // Package out for delivery
    DELIVERED,         // Successfully delivered to client
    RETURNED,          // Package returned to shop (NOT yet verified/restocked)
    RESTOCKED,         // Provider verified returned item and stock restored ✅ NEW
    CANCELLED,         // Cancelled by provider/client before shipping
    
    // ... deprecated statuses
}
```

**Status Lifecycle:**
- RETURNED is no longer a final state
- RESTOCKED is the new final state for failed deliveries
- Transition: `RETURNED → RESTOCKED` (provider only)

---

### 2. Order Entity - Added restockedAt Timestamp
**File:** `backend/src/main/java/esprit_market/entity/cart/Order.java`

```java
private LocalDateTime returnedAt;        // When returned to shop (failed delivery)
private LocalDateTime restockedAt;       // When provider verified return and stock restored ✅ NEW
```

**Removed:**
- `boolean pickedUpByProvider` flag (replaced by RESTOCKED status)

---

### 3. OrderStatusValidator - Added RESTOCKED Transition
**File:** `backend/src/main/java/esprit_market/service/cartService/OrderStatusValidator.java`

#### A. RETURNED is No Longer Final
```java
case RETURNED:
    validateFromReturned(newStatus, actor);
    break;
case RESTOCKED:
case DELIVERED:
case CANCELLED:
    throw new IllegalStateException(
        String.format("Cannot change status from %s (final state)", currentStatus)
    );
```

#### B. New Validation Method
```java
private void validateFromReturned(OrderStatus newStatus, String actor) {
    if (newStatus == OrderStatus.RESTOCKED) {
        if (!"PROVIDER".equals(actor) && !"ADMIN".equals(actor)) {
            throw new IllegalStateException("Only provider or admin can restock returned orders");
        }
    } else {
        throw new IllegalStateException(
            String.format("Invalid transition from RETURNED to %s. Only RESTOCKED allowed.", newStatus)
        );
    }
}
```

**Allowed Transition:**
- `RETURNED → RESTOCKED` (provider or admin only)

**Forbidden:**
- `RETURNED → DELIVERED` ❌
- `RETURNED → CANCELLED` ❌
- `RETURNED → CONFIRMED` ❌

---

### 4. OrderServiceImpl - Stock Restoration Logic
**File:** `backend/src/main/java/esprit_market/service/cartService/OrderServiceImpl.java`

#### A. RETURNED Case (No Stock Restoration)
```java
case RETURNED:
    order.setReturnedAt(LocalDateTime.now());
    
    // ❌ DO NOT restore stock here - provider must verify and restock first
    // Stock will be restored when status changes to RESTOCKED
    
    // Deduct loyalty points if they were granted
    if (order.getPaymentStatus() == PaymentStatus.PAID) {
        deductLoyaltyPointsForOrder(order);
    }
    
    log.info("📦 Order {} marked as RETURNED, waiting for provider verification", 
            order.getOrderNumber());
    break;
```

#### B. RESTOCKED Case (Stock Restoration)
```java
case RESTOCKED:
    order.setRestockedAt(LocalDateTime.now());
    
    // ✅ CRITICAL: Restore stock when provider verifies and restocks
    if (wasConfirmedOrLater) {
        restoreStockForOrder(order);
        log.info("📦 Order {} restocked by provider, stock restored", order.getOrderNumber());
    }
    break;
```

#### C. Updated confirmPickup() Method
```java
@Override
@Transactional
public OrderResponse confirmPickup(ObjectId orderId) {
    Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    
    // Validation: Order must be RETURNED
    if (order.getStatus() != OrderStatus.RETURNED) {
        throw new IllegalStateException(
                String.format("Cannot restock: Order %s is not RETURNED (current status: %s)", 
                        order.getOrderNumber(), order.getStatus()));
    }
    
    // Change status to RESTOCKED (this will trigger stock restoration via updateOrderStatus)
    return updateOrderStatus(orderId, "RESTOCKED", "PROVIDER");
}
```

**Key Points:**
- Method name kept as `confirmPickup()` for backward compatibility
- Now changes status to RESTOCKED instead of setting a flag
- Stock restoration happens automatically via `updateOrderStatus()` → RESTOCKED case

---

### 5. Controller - Endpoints Remain Same
**File:** `backend/src/main/java/esprit_market/controller/providerController/ProviderOrderController.java`

#### A. Get Returned Orders (Updated Filter)
```java
/**
 * GET /api/provider/orders/returned
 * Returns orders with status=RETURNED (not yet RESTOCKED)
 */
@GetMapping("/returned")
public ResponseEntity<List<OrderResponse>> getReturnedOrders(Authentication authentication)
```

**Filter Logic:**
- Query: `status = RETURNED`
- No longer checks `pickedUpByProvider` flag
- Once restocked, order disappears from this list (status = RESTOCKED)

#### B. Restock Order (Same Endpoint)
```java
/**
 * POST /api/provider/orders/{orderId}/pickup
 * Changes order status from RETURNED to RESTOCKED and restores stock
 */
@PostMapping("/{orderId}/pickup")
public ResponseEntity<OrderResponse> confirmPickup(...)
```

**Endpoint kept as `/pickup` for backward compatibility**

---

## Complete Workflow

### Scenario: Customer orders 3 items (stock = 10)

1. **Customer places order:**
   ```
   orderStatus = PENDING
   stock = 10 (unchanged)
   ```

2. **Provider confirms:**
   ```
   orderStatus = CONFIRMED
   stock = 7 (reduced by 3)
   ```

3. **Delivery workflow:**
   ```
   CONFIRMED → PREPARING → IN_TRANSIT
   stock = 7 (unchanged)
   ```

4. **Delivery fails (customer not home):**
   ```
   orderStatus = RETURNED
   returnedAt = 2026-04-29T15:30:00
   stock = 7 (NOT restored yet) ❌
   ```

5. **Provider sees in dashboard:**
   ```
   GET /api/provider/orders/returned
   → Shows this order in "Returned Orders" section
   ```

6. **Provider physically receives package and clicks "Restock":**
   ```
   POST /api/provider/orders/{orderId}/pickup
   
   Backend:
   - Validates status = RETURNED ✅
   - Changes status to RESTOCKED
   - Triggers stock restoration
   - Sets restockedAt timestamp
   
   Result:
   orderStatus = RESTOCKED
   restockedAt = 2026-04-29T16:00:00
   stock = 10 (restored) ✅
   ```

7. **Order disappears from "Returned Orders" list:**
   ```
   GET /api/provider/orders/returned
   → No longer shows this order (status = RESTOCKED)
   ```

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
    "returnedAt": "2026-04-28T15:30:00",
    "items": [
      {
        "productName": "Wireless Keyboard",
        "quantity": 3,
        "price": 85.0
      }
    ],
    "totalAmount": 255.0
  }
]
```

### 2. Restock Order
```http
POST /api/provider/orders/{orderId}/pickup
Authorization: Bearer {provider_jwt_token}
```

**Success Response (200):**
```json
{
  "orderId": "69ec97193d512c6d8be33058",
  "orderNumber": "ORD-20260428-0037",
  "status": "RESTOCKED",
  "returnedAt": "2026-04-28T15:30:00",
  "restockedAt": "2026-04-29T16:00:00"
}
```

**Error Responses:**
- `400` - Order not RETURNED (e.g., already RESTOCKED)
- `404` - Order not found
- `403` - Order doesn't contain provider's products

---

## Database Schema

### Order Collection
```javascript
{
  "_id": ObjectId("..."),
  "status": "RETURNED",  // or "RESTOCKED"
  "returnedAt": ISODate("2026-04-28T15:30:00Z"),
  "restockedAt": ISODate("2026-04-29T16:00:00Z"),  // NEW FIELD
  // ... other fields
}
```

**Removed Field:**
- `pickedUpByProvider` (boolean) - replaced by RESTOCKED status

**Index Recommendation:**
```javascript
db.orders.createIndex({ "status": 1 })
```

---

## Status Transition Matrix

| From Status | To Status | Actor | Stock Action | Allowed? |
|------------|-----------|-------|--------------|----------|
| PENDING | CONFIRMED | Provider | Reduce | ✅ |
| CONFIRMED | PREPARING | Delivery | None | ✅ |
| PREPARING | IN_TRANSIT | Delivery | None | ✅ |
| IN_TRANSIT | DELIVERED | Delivery | None | ✅ |
| IN_TRANSIT | RETURNED | Delivery | None | ✅ |
| **RETURNED** | **RESTOCKED** | **Provider** | **Restore** | ✅ |
| RETURNED | DELIVERED | Any | - | ❌ |
| RETURNED | CANCELLED | Any | - | ❌ |
| RESTOCKED | Any | Any | - | ❌ (final) |

---

## Frontend Integration

### Provider Dashboard - Returned Orders Section

```typescript
// Service
export class ProviderOrderService {
  
  // Get returned orders waiting for restocking
  getReturnedOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/provider/orders/returned`);
  }
  
  // Restock order (changes status to RESTOCKED)
  restockOrder(orderId: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/provider/orders/${orderId}/pickup`, {});
  }
}
```

### Component
```typescript
export class ReturnedOrdersComponent implements OnInit {
  returnedOrders: Order[] = [];
  
  ngOnInit() {
    this.loadReturnedOrders();
  }
  
  loadReturnedOrders() {
    this.orderService.getReturnedOrders().subscribe(
      orders => this.returnedOrders = orders
    );
  }
  
  restockOrder(orderId: string) {
    if (confirm('Confirm that you have physically received this returned item?')) {
      this.orderService.restockOrder(orderId).subscribe(
        () => {
          this.toastr.success('Order restocked successfully, stock restored');
          this.loadReturnedOrders(); // Refresh list
        },
        error => this.toastr.error('Failed to restock order')
      );
    }
  }
}
```

### Template
```html
<div class="returned-orders-section">
  <h3>Returned Orders - Awaiting Verification</h3>
  <p class="text-muted">These orders were returned by delivery. Verify the items and restock.</p>
  
  <div *ngIf="returnedOrders.length === 0" class="alert alert-info">
    No returned orders waiting for verification.
  </div>
  
  <div *ngFor="let order of returnedOrders" class="order-card">
    <div class="order-header">
      <h5>{{ order.orderNumber }}</h5>
      <span class="badge badge-warning">RETURNED</span>
    </div>
    
    <div class="order-details">
      <p><strong>Returned:</strong> {{ order.returnedAt | date:'short' }}</p>
      <p><strong>Items:</strong> {{ order.items.length }}</p>
      <p><strong>Total:</strong> {{ order.totalAmount | currency }}</p>
    </div>
    
    <div class="order-items">
      <div *ngFor="let item of order.items" class="item">
        <span>{{ item.productName }}</span>
        <span>Qty: {{ item.quantity }}</span>
      </div>
    </div>
    
    <button (click)="restockOrder(order.orderId)" 
            class="btn btn-primary">
      <i class="fas fa-box"></i> Verify & Restock
    </button>
  </div>
</div>
```

---

## Testing

### Test Case 1: Normal Restock Flow
```bash
# 1. Create order and confirm (stock reduced)
# 2. Mark as IN_TRANSIT
# 3. Mark as RETURNED
curl -X PUT http://localhost:8090/api/orders/{orderId}/status?status=RETURNED

# 4. Verify stock NOT restored yet
# Check product stock - should still be reduced

# 5. Provider restocks
curl -X POST http://localhost:8090/api/provider/orders/{orderId}/pickup \
  -H "Authorization: Bearer {provider_token}"

# 6. Verify status changed to RESTOCKED
# 7. Verify stock restored
```

### Test Case 2: Prevent Double Restock
```bash
# 1. Restock once (should succeed, status → RESTOCKED)
# 2. Try to restock again (should fail with 400: "Order is not RETURNED")
```

### Test Case 3: Wrong Status
```bash
# Try to restock DELIVERED order (should fail with 400)
# Try to restock PENDING order (should fail with 400)
```

### Test Case 4: Transition Validation
```bash
# Try to change RETURNED → DELIVERED (should fail)
# Try to change RETURNED → CANCELLED (should fail)
# Only RETURNED → RESTOCKED should work
```

---

## Migration Notes

### Existing RETURNED Orders in Database

**Option 1: Manual Migration (Recommended)**
```javascript
// Mark all existing RETURNED orders as RESTOCKED
db.orders.updateMany(
  { status: "RETURNED" },
  { 
    $set: { 
      status: "RESTOCKED",
      restockedAt: new Date()
    }
  }
)
```

**Option 2: Let Providers Handle**
- Existing RETURNED orders will appear in provider dashboard
- Providers can verify and restock them manually
- Stock will be restored when they click "Restock"

---

## Key Differences from Previous Implementation

| Aspect | Previous (Flag) | New (Status) |
|--------|----------------|--------------|
| Tracking | `pickedUpByProvider` boolean | `RESTOCKED` status |
| Final State | RETURNED | RESTOCKED |
| Stock Restore | Manual flag check | Automatic on status change |
| Query | Filter by flag | Filter by status |
| Clarity | Less clear | More explicit |
| Audit Trail | Flag + timestamp | Status + timestamp |

---

## Summary

✅ **Minimal Change:** Only added 1 new status, no complex redesign  
✅ **Clear Semantics:** RETURNED vs RESTOCKED is explicit  
✅ **Stock Safety:** Stock only restored when RESTOCKED  
✅ **Validation:** Prevents invalid transitions  
✅ **Backward Compatible:** Existing endpoints work with new logic  
✅ **Audit Trail:** `restockedAt` timestamp for tracking  

This implementation provides a clean, explicit workflow for handling returned orders with proper provider verification before stock restoration.
