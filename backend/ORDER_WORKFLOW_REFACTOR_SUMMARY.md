# Order Workflow Refactor - Complete Implementation

## Overview
Implemented proper order lifecycle with RETURNED logic and automatic stock restoration based on real delivery business logic.

---

## 1. Enum Updates

### OrderStatus.java
**New Statuses:**
- `PENDING` - Order created, awaiting provider confirmation
- `CONFIRMED` - Provider accepted, stock reduced
- `PREPARING` - Delivery preparing package
- `IN_TRANSIT` - Package out for delivery
- `DELIVERED` - Successfully delivered (final state)
- `RETURNED` - Package returned to shop after failed delivery (final state)
- `CANCELLED` - Cancelled before shipping (final state)

**Deprecated Legacy Statuses:**
- `PAID` → mapped to `PENDING`
- `ACCEPTED` → mapped to `CONFIRMED`
- `PROCESSING` → mapped to `PREPARING`
- `DECLINED` → mapped to `CANCELLED`
- `SHIPPED` → mapped to `IN_TRANSIT`
- `OUT_FOR_DELIVERY` → mapped to `IN_TRANSIT`

### PaymentStatus.java
**Statuses:**
- `PENDING_PAYMENT` - Cash orders not yet paid
- `PAID` - Payment completed
- `FAILED` - Payment failed (deprecated)
- `PENDING` (deprecated) - mapped to `PENDING_PAYMENT`

---

## 2. Workflow Implementation

### Checkout Logic (createOrderFromCart)
```
CARD Payment:
  paymentStatus = PAID
  orderStatus = PENDING
  → Provider must confirm
  → Stock reduced when CONFIRMED
  → Loyalty points granted when CONFIRMED

CASH Payment:
  paymentStatus = PENDING_PAYMENT
  orderStatus = PENDING
  → Provider must confirm
  → Stock reduced when CONFIRMED
  → Loyalty points granted when DELIVERED (payment collected)
```

### Provider Workflow
```
PENDING → CONFIRMED (provider accepts)
  ✅ Stock reduced immediately
  ✅ Loyalty points granted (if CARD payment)
  
PENDING → CANCELLED (provider rejects)
  ✅ No stock to restore
```

### Delivery Workflow
```
CONFIRMED → PREPARING (delivery accepts)
PREPARING → IN_TRANSIT (package out for delivery)

Success Path:
IN_TRANSIT → DELIVERED
  ✅ For CASH: paymentStatus = PAID
  ✅ For CASH: Loyalty points granted

Failure Path:
IN_TRANSIT → RETURNED
  ✅ Stock restored automatically
  ✅ Loyalty points deducted (if were granted)
```

### Cancellation Logic
```
PENDING → CANCELLED
  ✅ No stock to restore (never reduced)
  
CONFIRMED → CANCELLED (before PREPARING)
  ✅ Stock restored automatically
  ✅ Loyalty points deducted (if were granted)
  
Cannot cancel after PREPARING (too late)
```

---

## 3. Stock Management

### Stock Reduction
**Trigger:** `orderStatus = CONFIRMED`
```java
private void reduceStockForOrder(Order order) {
    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
    for (OrderItem item : items) {
        stockManagementService.reduceStock(item.getProductId(), item.getQuantity());
    }
}
```

### Stock Restoration
**Triggers:** 
- `orderStatus = RETURNED` (failed delivery)
- `orderStatus = CANCELLED` (if was CONFIRMED or later)

```java
private void restoreStockForOrder(Order order) {
    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
    for (OrderItem item : items) {
        stockManagementService.restoreStock(item.getProductId(), item.getQuantity());
    }
}
```

**Example:**
```
Initial stock: 5
Order quantity: 3
After CONFIRMED: stock = 2
After RETURNED: stock = 5 (restored)
```

---

## 4. Loyalty Points Logic

### Grant Points
**Triggers:**
- CARD payment: When `orderStatus = CONFIRMED`
- CASH payment: When `orderStatus = DELIVERED` (payment collected)

```java
private void grantLoyaltyPointsForOrder(Order order) {
    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
    loyaltyCardService.addPointsForOrder(
        order.getUser().getId(), 
        items, 
        order.getFinalAmount()
    );
}
```

### Deduct Points
**Triggers:**
- `orderStatus = RETURNED`
- `orderStatus = CANCELLED` (if points were granted)

```java
private void deductLoyaltyPointsForOrder(Order order) {
    List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
    int pointsToDeduct = loyaltyCardService.calculatePointsForOrder(
        order.getUser().getId(), 
        items, 
        order.getFinalAmount()
    );
    loyaltyCardService.deductPoints(order.getUser().getId(), pointsToDeduct);
}
```

---

## 5. Status Transition Validation

### OrderStatusValidator.java
**Valid Transitions:**
```
PENDING → CONFIRMED (provider)
PENDING → CANCELLED (provider/client)

CONFIRMED → PREPARING (delivery)
CONFIRMED → CANCELLED (client/admin, before delivery starts)

PREPARING → IN_TRANSIT (delivery)

IN_TRANSIT → DELIVERED (delivery, success)
IN_TRANSIT → RETURNED (delivery, failed)
```

**Forbidden Transitions:**
- Cannot go backwards
- Cannot change final states (DELIVERED, RETURNED, CANCELLED)
- Cannot cancel after PREPARING

---

## 6. Entity Updates

### Order.java
**New Fields:**
```java
private LocalDateTime preparingAt;      // When delivery started preparing
private LocalDateTime returnedAt;        // When returned to shop
```

**Existing Fields:**
```java
private LocalDateTime createdAt;
private LocalDateTime paidAt;
private LocalDateTime confirmedAt;
private LocalDateTime deliveryStartedAt; // When in transit
private LocalDateTime deliveredAt;
private LocalDateTime cancelledAt;
```

---

## 7. Files Modified

### Backend
1. `backend/src/main/java/esprit_market/Enum/cartEnum/OrderStatus.java`
   - Added: PREPARING, IN_TRANSIT, RETURNED
   - Updated documentation

2. `backend/src/main/java/esprit_market/Enum/cartEnum/PaymentStatus.java`
   - Added: @Deprecated PENDING for backward compatibility

3. `backend/src/main/java/esprit_market/entity/cart/Order.java`
   - Added: preparingAt, returnedAt timestamps

4. `backend/src/main/java/esprit_market/service/cartService/OrderStatusValidator.java`
   - Complete rewrite with new transition rules
   - Added: validateFromPreparing(), validateFromInTransit()

5. `backend/src/main/java/esprit_market/service/cartService/OrderServiceImpl.java`
   - Updated: createOrderFromCart() - orders start as PENDING
   - Updated: updateOrderStatus() - complete rewrite with RETURNED logic
   - Added: reduceStockForOrder()
   - Updated: restoreStockForOrder()
   - Added: grantLoyaltyPointsForOrder()
   - Added: deductLoyaltyPointsForOrder()
   - Updated: normalizeLegacyStatus() - new mappings

---

## 8. Key Business Rules

### Stock Management
✅ Stock reduced when: `orderStatus = CONFIRMED`
✅ Stock restored when: `orderStatus = RETURNED` or `CANCELLED` (if was CONFIRMED)

### Payment Status
✅ CARD: `paymentStatus = PAID` immediately
✅ CASH: `paymentStatus = PENDING_PAYMENT` → `PAID` when delivered

### Loyalty Points
✅ CARD: Granted when `CONFIRMED`
✅ CASH: Granted when `DELIVERED`
✅ Deducted when `RETURNED` or `CANCELLED`

### Cancellation Window
✅ Client can cancel within 7 days of order creation
✅ Cannot cancel after `PREPARING` (too late)

---

## 9. RETURNED vs CANCELLED

### CANCELLED
- Order cancelled **before shipping**
- Triggered by: Provider, Client, or Admin
- Happens at: PENDING or CONFIRMED stage
- Stock restored: Yes (if was CONFIRMED)

### RETURNED
- Package **returned after failed delivery**
- Triggered by: Delivery only
- Happens at: IN_TRANSIT stage
- Stock restored: Yes (always)
- Reason: Customer not home, wrong address, refused package, etc.

---

## 10. Backward Compatibility

### Legacy Status Migration
Old MongoDB orders with deprecated statuses are automatically normalized:
- `PAID` → `PENDING` (needs provider confirmation)
- `ACCEPTED` → `CONFIRMED`
- `PROCESSING` → `PREPARING`
- `DECLINED` → `CANCELLED`
- `SHIPPED` → `IN_TRANSIT`
- `OUT_FOR_DELIVERY` → `IN_TRANSIT`

### Legacy Payment Status
- `PENDING` → `PENDING_PAYMENT`

---

## 11. Next Steps (Frontend)

### Provider Dashboard
**Remove:**
- PAID as order status option
- OUT_FOR_DELIVERY status
- Any obsolete status references

**Show Only:**
- Confirm button (PENDING → CONFIRMED)
- Cancel button (PENDING → CANCELLED)

### Delivery Dashboard
**Show:**
- Accept Order (CONFIRMED → PREPARING)
- Start Delivery (PREPARING → IN_TRANSIT)
- Mark Delivered (IN_TRANSIT → DELIVERED)
- Mark Returned (IN_TRANSIT → RETURNED)

### Status Badges
Update status display to show:
- PENDING (yellow)
- CONFIRMED (blue)
- PREPARING (purple)
- IN_TRANSIT (orange)
- DELIVERED (green)
- RETURNED (red)
- CANCELLED (gray)

---

## 12. Testing Checklist

### CARD Payment Flow
- [ ] Order created as PENDING with paymentStatus=PAID
- [ ] Provider confirms → stock reduced, loyalty points granted
- [ ] Delivery: CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED
- [ ] Delivery: IN_TRANSIT → RETURNED → stock restored, points deducted

### CASH Payment Flow
- [ ] Order created as PENDING with paymentStatus=PENDING_PAYMENT
- [ ] Provider confirms → stock reduced, NO loyalty points yet
- [ ] Delivery: CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED
- [ ] On DELIVERED: paymentStatus=PAID, loyalty points granted
- [ ] Delivery: IN_TRANSIT → RETURNED → stock restored

### Cancellation
- [ ] Cancel PENDING → no stock to restore
- [ ] Cancel CONFIRMED → stock restored, points deducted
- [ ] Cannot cancel after PREPARING

### Stock Restoration
- [ ] RETURNED: stock restored correctly
- [ ] CANCELLED (from CONFIRMED): stock restored correctly
- [ ] Verify quantities match original order

---

## 13. Migration Notes

### Database Migration
No migration script needed - backward compatibility handled automatically through:
1. Deprecated enum values
2. `normalizeLegacyStatus()` method
3. Automatic status mapping on read

### Deployment
1. Deploy backend with new code
2. Restart backend server
3. Old orders will be normalized automatically on first read
4. Update frontend to remove obsolete status options

---

## Summary

✅ Implemented complete order lifecycle with RETURNED logic
✅ Automatic stock restoration for RETURNED and CANCELLED orders
✅ Proper separation of PaymentStatus and OrderStatus
✅ Provider workflow: PENDING → CONFIRMED or CANCELLED
✅ Delivery workflow: CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED/RETURNED
✅ Stock reduced when CONFIRMED, restored when RETURNED/CANCELLED
✅ Loyalty points granted at correct time (CONFIRMED for CARD, DELIVERED for CASH)
✅ Backward compatibility with legacy statuses
✅ Comprehensive validation and error handling
