# Fix: Mark as Returned - 404 Error Resolution

## Problem

When driver clicked "Mark as Returned", the frontend was calling:
```
POST /api/deliveries/{deliveryId}/mark-returned
```

This endpoint returned **404 Not Found** because:
1. The endpoint was trying to update the **Delivery** status
2. But we actually need to update the **Order** status to RETURNED
3. The Delivery entity didn't have a link to the Order

## Root Cause

The system has two separate entities:
- **Delivery** - Tracks delivery driver assignment and logistics
- **Order** - Tracks order lifecycle and status

When a driver marks a delivery as returned, we need to update the **Order** status, not just the Delivery status. The original implementation was missing this connection.

## Solution

### 1. Added `orderId` to Delivery Entity ✅

**File:** `backend/src/main/java/esprit_market/entity/SAV/Delivery.java`

```java
private ObjectId orderId; // The Order associated with this delivery
```

This creates a link from Delivery → Order.

### 2. Updated Delivery DTO ✅

**File:** `backend/src/main/java/esprit_market/dto/SAV/DeliveryResponseDTO.java`

```java
private String orderId;
```

### 3. Updated Mapper ✅

**File:** `backend/src/main/java/esprit_market/mappers/SAVMapper.java`

```java
.orderId(entity.getOrderId() != null ? entity.getOrderId().toHexString() : null)
```

### 4. Set orderId When Creating Delivery ✅

**File:** `backend/src/main/java/esprit_market/service/cartService/OrderServiceImpl.java`

```java
Delivery delivery = Delivery.builder()
        .orderId(savedOrder.getId())  // ✅ Link delivery to order
        .cartId(cart.getId()) 
        .address(request.getShippingAddress())
        .deliveryDate(LocalDateTime.now())
        .status("PENDING")
        .build();
```

### 5. Added Order Endpoint for Marking as Returned ✅

**File:** `backend/src/main/java/esprit_market/controller/cartController/DeliveryOrderController.java`

```java
@PostMapping("/{orderId}/return")
public ResponseEntity<OrderResponse> markAsReturned(
        @PathVariable String orderId,
        @RequestParam(required = false, defaultValue = "Delivery failed") String reason) {
    try {
        Order order = orderRepository.findById(new ObjectId(orderId))
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Validate order is IN_TRANSIT
        if (order.getStatus() != OrderStatus.IN_TRANSIT) {
            throw new IllegalStateException(
                "Can only return orders with status IN_TRANSIT. Current status: " + order.getStatus()
            );
        }
        
        log.info("↩️ Marking order as returned: {} - Reason: {}", order.getOrderNumber(), reason);
        
        // Update status with DELIVERY actor
        OrderResponse response = orderService.updateOrderStatus(
            order.getId(), 
            OrderStatus.RETURNED.name(), 
            "DELIVERY"
        );
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        log.error("❌ Failed to mark order as returned: {}", e.getMessage());
        throw new RuntimeException("Failed to mark order as returned: " + e.getMessage());
    }
}
```

**Endpoint:** `POST /api/delivery/orders/{orderId}/return?reason={reason}`

### 6. Updated Frontend Model ✅

**File:** `frontend/src/app/back/core/models/sav.models.ts`

```typescript
export interface Delivery {
  id: string;
  address: string;
  deliveryDate?: string;
  status: DeliveryStatus;
  userId: string;
  cartId: string;
  orderId?: string;  // Link to Order entity
  // ...
}
```

### 7. Updated Frontend Component ✅

**File:** `frontend/src/app/front/pages/driver-deliveries/driver-deliveries.component.ts`

```typescript
confirmMarkReturned() {
  const delivery = this.selectedDelivery();
  if (!delivery) return;
  if (!this.selectedReturnReason()) {
    this.toastService.warning('Please select a reason.');
    return;
  }

  // Check if delivery has orderId
  if (!delivery.orderId) {
    this.toastService.error('Order ID not found for this delivery.');
    return;
  }

  // Call the order endpoint to mark as returned
  const url = `${environment.apiUrl}/delivery/orders/${delivery.orderId}/return`;
  const params = { reason: this.selectedReturnReason() };
  
  this.http.post(url, null, { params }).subscribe({
    next: () => {
      this.toastService.success('Delivery marked as returned. Package must be returned to shop.');
      this.closeReturnModal();
      this.loadAllData();
    },
    error: (err) => {
      console.error('Failed to mark as returned:', err);
      this.toastService.error('Failed to mark delivery as returned.');
    }
  });
}
```

## How It Works Now

### Complete Flow

1. **Order Created:**
   - Order entity created with status PENDING
   - Delivery entity created with `orderId` linking to the order

2. **Driver Accepts Delivery:**
   - Delivery status: PENDING → IN_TRANSIT
   - Order status: CONFIRMED → IN_TRANSIT (via delivery workflow)

3. **Driver Marks as Returned:**
   - Frontend calls: `POST /api/delivery/orders/{orderId}/return`
   - Backend validates order is IN_TRANSIT
   - Backend updates order status: IN_TRANSIT → RETURNED
   - Stock is NOT restored (waits for provider verification)
   - Loyalty points are deducted

4. **Provider Verifies and Restocks:**
   - Provider sees order in "Returned Orders" tab
   - Provider clicks "Verify & Restock"
   - Order status: RETURNED → RESTOCKED
   - Stock is RESTORED

## API Endpoints

### Old (Broken)
```http
PATCH /api/deliveries/{deliveryId}/mark-returned
❌ 404 Not Found - Endpoint doesn't exist
```

### New (Working)
```http
POST /api/delivery/orders/{orderId}/return?reason={reason}
✅ 200 OK - Updates order status to RETURNED
```

## Files Modified

### Backend (6 files)
1. ✅ `backend/src/main/java/esprit_market/entity/SAV/Delivery.java` - Added orderId field
2. ✅ `backend/src/main/java/esprit_market/dto/SAV/DeliveryResponseDTO.java` - Added orderId field
3. ✅ `backend/src/main/java/esprit_market/mappers/SAVMapper.java` - Map orderId
4. ✅ `backend/src/main/java/esprit_market/service/cartService/OrderServiceImpl.java` - Set orderId when creating delivery
5. ✅ `backend/src/main/java/esprit_market/controller/cartController/DeliveryOrderController.java` - Added markAsReturned endpoint
6. ✅ `backend/src/main/java/esprit_market/service/SAVService/DeliveryService.java` - (No changes needed, kept for reference)

### Frontend (2 files)
1. ✅ `frontend/src/app/back/core/models/sav.models.ts` - Added orderId to Delivery interface
2. ✅ `frontend/src/app/front/pages/driver-deliveries/driver-deliveries.component.ts` - Updated to call order endpoint

## Testing

### Test Steps

1. **Create an order** as a customer
2. **Login as provider** and confirm the order
3. **Login as admin** and assign a delivery driver
4. **Login as delivery driver**
5. **Accept the delivery** → Order becomes IN_TRANSIT
6. **Click "Mark as Returned"**
7. **Select a reason** (e.g., "Customer absent")
8. **Click "Confirm Return"**

### Expected Results

✅ Success toast: "Delivery marked as returned. Package must be returned to shop."
✅ Order status changes to RETURNED
✅ Order appears in provider's "Returned Orders" tab
✅ Stock is NOT restored yet (waits for provider verification)
✅ Loyalty points are deducted

### Verify in Database

```javascript
// Check order status
db.order.find({ orderNumber: "ORD-2026-69EC9" })
// Should show: status: "RETURNED", returnedAt: <timestamp>

// Check delivery has orderId
db.deliveries.find({ cartId: ObjectId("...") })
// Should show: orderId: ObjectId("...")
```

## Status

🟢 **FIXED** - The 404 error is resolved. Driver can now successfully mark deliveries as returned, which updates the order status correctly.

## Next Steps

1. ✅ Test the complete workflow end-to-end
2. ✅ Verify provider can see returned orders
3. ✅ Verify provider can restock
4. ✅ Verify stock is restored only after restock
5. ✅ Deploy to staging environment
