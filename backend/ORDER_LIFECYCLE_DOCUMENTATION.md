# Order Lifecycle Documentation

## Overview
This document describes the complete order lifecycle in the marketplace system, including status transitions, payment handling, and module integration.

---

## Order Status Enum

```java
public enum OrderStatus {
    PENDING,           // Order created, waiting for provider confirmation
    CONFIRMED,         // Provider accepted, ready for delivery
    REJECTED,          // Provider declined the order
    CANCELLED,         // Cancelled by client or timeout
    OUT_FOR_DELIVERY,  // Delivery driver has taken the order
    DELIVERED          // Successfully delivered to client
}
```

## Payment Status Enum

```java
public enum PaymentStatus {
    UNPAID,  // Payment not yet received (Cash on Delivery)
    PAID     // Payment completed (Card or COD after delivery)
}
```

---

## Business Flows

### CASE 1: Pay by Card

```
1. Client creates order
   ├─ OrderStatus: PENDING
   ├─ PaymentStatus: PAID (immediately)
   └─ Stock: NOT reduced yet

2. Provider accepts order
   ├─ OrderStatus: PENDING → CONFIRMED
   ├─ Actor: PROVIDER only
   └─ Stock: Reduced when order created

3. Delivery takes order
   ├─ OrderStatus: CONFIRMED → OUT_FOR_DELIVERY
   ├─ Actor: DELIVERY only
   └─ Validation: Can only take if status = CONFIRMED

4. Delivery completes
   ├─ OrderStatus: OUT_FOR_DELIVERY → DELIVERED
   ├─ Actor: DELIVERY only
   ├─ Validation: Can only deliver if status = OUT_FOR_DELIVERY
   └─ PaymentStatus: Already PAID
```

### CASE 2: Cash on Delivery

```
1. Client creates order
   ├─ OrderStatus: PENDING
   ├─ PaymentStatus: UNPAID
   └─ Stock: NOT reduced yet

2. Provider accepts order
   ├─ OrderStatus: PENDING → CONFIRMED
   ├─ Actor: PROVIDER only
   └─ Stock: Reduced when order created

3. Delivery takes order
   ├─ OrderStatus: CONFIRMED → OUT_FOR_DELIVERY
   ├─ Actor: DELIVERY only
   └─ Validation: Can only take if status = CONFIRMED

4. Delivery completes
   ├─ OrderStatus: OUT_FOR_DELIVERY → DELIVERED
   ├─ PaymentStatus: UNPAID → PAID (automatically)
   ├─ Actor: DELIVERY only
   └─ Validation: Can only deliver if status = OUT_FOR_DELIVERY
```

### CASE 3: Provider Rejects Order

```
1. Client creates order
   └─ OrderStatus: PENDING

2. Provider rejects order
   ├─ OrderStatus: PENDING → REJECTED
   ├─ Actor: PROVIDER only
   └─ Stock: Restored (if was reduced)
```

### CASE 4: Client Cancels Order

```
1. Client creates order
   └─ OrderStatus: PENDING

2. Client cancels (within 7 days)
   ├─ OrderStatus: PENDING → CANCELLED
   ├─ Actor: CLIENT only
   ├─ Validation: Only within 7 days of creation
   └─ Stock: Restored (if was reduced)
```

### CASE 5: Auto-Cancellation (48h Timeout)

```
1. Client creates order
   └─ OrderStatus: PENDING

2. Provider does not respond for 48 hours
   ├─ OrderStatus: PENDING → CANCELLED
   ├─ Actor: SYSTEM (scheduled job)
   ├─ Reason: "Auto-cancelled: Provider did not respond within 48 hours"
   └─ Stock: Restored (if was reduced)
```

---

## Status Transition Rules

### Allowed Transitions

| From Status       | To Status         | Actor    | Validation |
|-------------------|-------------------|----------|------------|
| PENDING           | CONFIRMED         | PROVIDER | Provider owns products in order |
| PENDING           | REJECTED          | PROVIDER | Provider owns products in order |
| PENDING           | CANCELLED         | CLIENT   | Within 7 days of creation |
| PENDING           | CANCELLED         | SYSTEM   | After 48 hours timeout |
| CONFIRMED         | OUT_FOR_DELIVERY  | DELIVERY | Order is confirmed |
| CONFIRMED         | CANCELLED         | CLIENT   | Rare case, allowed |
| CONFIRMED         | CANCELLED         | ADMIN    | Admin override |
| OUT_FOR_DELIVERY  | DELIVERED         | DELIVERY | Order is out for delivery |

### Forbidden Transitions

❌ Cannot skip statuses (e.g., PENDING → DELIVERED)
❌ Cannot go backwards (e.g., DELIVERED → CONFIRMED)
❌ Cannot change from final states (REJECTED, CANCELLED, DELIVERED)
❌ Delivery cannot take order unless CONFIRMED
❌ Delivery cannot mark DELIVERED unless OUT_FOR_DELIVERY

---

## API Endpoints

### Provider Endpoints

```
PUT /api/provider/orders/{orderId}/status?status=CONFIRMED
PUT /api/provider/orders/{orderId}/status?status=REJECTED

Requirements:
- Role: PROVIDER
- Can only update orders containing their products
- Can only set status to CONFIRMED or REJECTED
- Order must be in PENDING status
```

### Delivery Endpoints

```
POST /api/delivery/orders/{orderId}/take
POST /api/delivery/orders/{orderId}/deliver
GET  /api/delivery/orders/available
GET  /api/delivery/orders/in-transit

Requirements:
- Role: DELIVERY or ADMIN
- Can only take orders with status = CONFIRMED
- Can only deliver orders with status = OUT_FOR_DELIVERY
```

### Client Endpoints

```
POST /api/orders/{orderId}/cancel

Requirements:
- Role: CLIENT
- Can only cancel own orders
- Order must be in PENDING status
- Within 7 days of order creation
```

---

## Validation Service

### OrderStatusValidator

```java
@Service
public class OrderStatusValidator {
    
    // Validates if status transition is allowed
    void validateTransition(Order order, OrderStatus newStatus, String actor)
    
    // Check if client can cancel order (within 7 days)
    boolean canClientCancelOrder(Order order)
    
    // Check if order should be auto-cancelled (48h timeout)
    boolean shouldAutoCancelOrder(Order order)
}
```

---

## Auto-Cancellation Job

### OrderAutoCancellationService

```java
@Scheduled(cron = "0 0 * * * *") // Every hour
public void autoCancelExpiredOrders()
```

**Behavior:**
- Runs every hour
- Finds all PENDING orders
- Checks if 48 hours have passed since creation
- Auto-cancels expired orders
- Restores stock
- Sets cancellation reason

---

## Stock Management

### When Stock is Reduced
- When order is created (regardless of payment method)
- Validates availability before order creation

### When Stock is Restored
- Order status changes to REJECTED
- Order status changes to CANCELLED
- Automatic restoration in updateOrderStatus method

---

## Payment Handling

### Card Payment
- PaymentStatus set to PAID immediately when order created
- Payment ID stored in order.paymentId
- paidAt timestamp set

### Cash on Delivery
- PaymentStatus set to UNPAID when order created
- When delivery marks DELIVERED:
  - PaymentStatus automatically changes to PAID
  - paidAt timestamp set
  - Logged in system

---

## Module Integration

### Order Module ↔ Provider Module
- Provider can only update orders containing their products
- Provider can CONFIRM or REJECT orders
- Validation enforced by OrderStatusValidator

### Order Module ↔ Delivery Module
- Delivery can only take CONFIRMED orders
- Delivery can only mark DELIVERED if OUT_FOR_DELIVERY
- Strict validation prevents skipping statuses

### Order Module ↔ Delivery Entity (SAV Module)
- Order.deliveryId links to Delivery entity
- Delivery status (PREPARING, IN_TRANSIT, DELIVERED) is separate
- Order status and Delivery status should be synchronized

---

## Frontend Behavior

### Provider Dashboard
```
- Show only PENDING orders for action
- Display "Accept" and "Reject" buttons
- After action, order moves to CONFIRMED or REJECTED
- Cannot modify orders in other statuses
```

### Delivery Dashboard
```
- Show only CONFIRMED orders in "Available" tab
- Show only OUT_FOR_DELIVERY orders in "In Transit" tab
- "Take Order" button for CONFIRMED orders
- "Mark Delivered" button for OUT_FOR_DELIVERY orders
```

### Client Profile
```
- Show all order statuses
- "Cancel" button only for PENDING orders within 7 days
- Display countdown: "Can cancel for X more days"
- Show payment status separately from order status
```

---

## Error Messages

### Common Validation Errors

```
"Only provider can confirm orders"
"Only provider can reject orders"
"Only delivery can take confirmed orders"
"Only delivery can mark orders as delivered"
"Client can only cancel within 7 days of order creation"
"Cannot change status from DELIVERED (final state)"
"Invalid transition from PENDING to DELIVERED"
"Can only take orders with status CONFIRMED"
"Can only mark delivered orders with status OUT_FOR_DELIVERY"
```

---

## Migration Notes

### Legacy Status Handling

The system includes deprecated statuses for backward compatibility:
- `PAID` → Use PaymentStatus.PAID instead
- `DECLINED` → Use REJECTED or CANCELLED instead

### Migration Strategy
1. New orders use new status flow
2. Existing orders with legacy statuses continue to work
3. Gradual migration of old orders to new statuses
4. Frontend displays both old and new statuses correctly

---

## Testing Checklist

### Provider Tests
- [ ] Provider can confirm PENDING order
- [ ] Provider can reject PENDING order
- [ ] Provider cannot confirm CONFIRMED order
- [ ] Provider cannot modify other provider's orders

### Delivery Tests
- [ ] Delivery can take CONFIRMED order
- [ ] Delivery cannot take PENDING order
- [ ] Delivery can mark OUT_FOR_DELIVERY as DELIVERED
- [ ] Delivery cannot mark CONFIRMED as DELIVERED

### Client Tests
- [ ] Client can cancel PENDING order within 7 days
- [ ] Client cannot cancel after 7 days
- [ ] Client cannot cancel CONFIRMED order
- [ ] Client sees correct payment status

### System Tests
- [ ] Auto-cancellation runs every hour
- [ ] Orders auto-cancel after 48 hours
- [ ] Stock is restored on cancellation
- [ ] COD payment marked PAID on delivery

---

## Monitoring & Logging

### Key Log Messages

```
🔄 Order {orderNumber} status change: {old} → {new} (by {actor})
✅ Order {orderNumber} confirmed by provider
🚚 Order {orderNumber} taken by delivery
📦 Order {orderNumber} delivered successfully
💰 Cash on Delivery payment completed for order {orderNumber}
❌ Order {orderNumber} cancelled/rejected, stock restored
⏰ Auto-cancelling order {orderNumber} (48h timeout)
```

### Metrics to Monitor
- Average time from PENDING to CONFIRMED
- Auto-cancellation rate
- Delivery completion rate
- COD payment success rate

---

## Summary

This order lifecycle system provides:
✅ Clear status transitions with validation
✅ Separate payment status handling
✅ Module integration with strict rules
✅ Auto-cancellation for abandoned orders
✅ Stock management with automatic restoration
✅ Comprehensive logging and error handling
✅ Backward compatibility with legacy statuses

The system ensures that orders flow correctly through the marketplace, with proper validation at each step and clear separation of concerns between modules.
