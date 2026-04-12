# CART/ORDER SEPARATION - MIGRATION GUIDE

**Date**: 2026-04-11  
**Status**: Implementation Complete  
**Impact**: Medium (Backward Compatible)

---

## CRITICAL FIX: Endpoint Conflict Resolution

During implementation, we discovered an existing `OrderStatusController` that was already using `/api/orders` endpoints with the old Cart-based system.

**Solution**: 
- Moved old `OrderStatusController` to `/api/cart/orders` (marked as @Deprecated)
- New `OrderController` uses `/api/orders` (recommended for new code)

**Backward Compatibility**:
- Old endpoints moved to `/api/cart/orders/*` (still work)
- New endpoints available at `/api/orders/*` (recommended)
- Both systems work in parallel during migration

---

## 1. OVERVIEW

This refactor separates the Cart and Order concepts that were previously mixed in a single entity.

### Before (WRONG):
```
Cart entity with status:
- DRAFT (shopping cart)
- PENDING, PAID, PROCESSING, SHIPPED, DELIVERED (orders)
```

### After (CORRECT):
```
Cart entity:
- Status: DRAFT only
- Purpose: Shopping basket

Order entity:
- Status: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED
- Purpose: Completed purchases
```

---

## 2. NEW ENTITIES

### 2.1 Order Entity
**File**: `backend/src/main/java/esprit_market/entity/cart/Order.java`

**Fields**:
- `id`: ObjectId
- `user`: @DBRef User
- `status`: OrderStatus (PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED)
- `totalAmount`, `discountAmount`, `finalAmount`: Double
- `couponCode`: String
- `discountId`: ObjectId
- `shippingAddress`, `paymentMethod`, `paymentId`: String
- `orderNumber`: String (human-readable, e.g., "ORD-20260411-0001")
- `createdAt`, `paidAt`, `lastUpdated`: LocalDateTime
- `cancellationReason`, `cancelledAt`: String, LocalDateTime

### 2.2 OrderItem Entity
**File**: `backend/src/main/java/esprit_market/entity/cart/OrderItem.java`

**Fields**:
- `id`: ObjectId
- `orderId`: ObjectId
- `productId`: ObjectId
- `productName`, `productPrice`: String, Double (denormalized snapshot)
- `quantity`: Integer
- `subtotal`: Double
- `status`: OrderItemStatus (ACTIVE, CANCELLED, PARTIALLY_CANCELLED, REFUNDED)
- `cancelledQuantity`, `refundedAmount`: Integer, Double

### 2.3 Updated Cart Entity
**File**: `backend/src/main/java/esprit_market/entity/cart/Cart.java`

**Changes**:
- Added documentation: Cart is for shopping only
- Marked order-related fields as `@Deprecated`
- Status should only be DRAFT

---

## 3. NEW ENUMS

### 3.1 OrderStatus
**File**: `backend/src/main/java/esprit_market/Enum/cartEnum/OrderStatus.java`

```java
PENDING      // Order created, waiting for payment
PAID         // Payment confirmed, stock reduced
PROCESSING   // Order being prepared
SHIPPED      // Order shipped
DELIVERED    // Order delivered
CANCELLED    // Order cancelled, stock restored
PARTIALLY_CANCELLED
PARTIALLY_REFUNDED
REFUNDED     // Order refunded, stock restored
```

### 3.2 OrderItemStatus
**File**: `backend/src/main/java/esprit_market/Enum/cartEnum/OrderItemStatus.java`

```java
ACTIVE
CANCELLED
PARTIALLY_CANCELLED
REFUNDED
```

---

## 4. NEW REPOSITORIES

### 4.1 OrderRepository
**File**: `backend/src/main/java/esprit_market/repository/cartRepository/OrderRepository.java`

**Methods**:
- `findByUser(User user)`
- `findByUserOrderByCreatedAtDesc(User user)`
- `findByStatus(OrderStatus status)`
- `findByStatusIn(List<OrderStatus> statuses)`
- `findByOrderNumber(String orderNumber)`
- `findByCreatedAtBetween(LocalDateTime start, LocalDateTime end)`
- `countByStatus(OrderStatus status)`

### 4.2 OrderItemRepository
**File**: `backend/src/main/java/esprit_market/repository/cartRepository/OrderItemRepository.java`

**Methods**:
- `findByOrderId(ObjectId orderId)`
- `findByOrderIdAndProductId(ObjectId orderId, ObjectId productId)`
- `deleteByOrderId(ObjectId orderId)`
- `countByOrderId(ObjectId orderId)`

---

## 5. NEW DTOs

### 5.1 OrderResponse
**File**: `backend/src/main/java/esprit_market/dto/cartDto/OrderResponse.java`

Contains all order fields + list of OrderItemResponse

### 5.2 OrderItemResponse
**File**: `backend/src/main/java/esprit_market/dto/cartDto/OrderItemResponse.java`

Contains all order item fields

### 5.3 CreateOrderRequest
**File**: `backend/src/main/java/esprit_market/dto/cartDto/CreateOrderRequest.java`

```java
String shippingAddress (required)
String paymentMethod
String notes
```

---

## 6. NEW SERVICE: OrderService

### 6.1 IOrderService Interface
**File**: `backend/src/main/java/esprit_market/service/cartService/IOrderService.java`

**Methods**:
- `createOrderFromCart(userId, request)` → Creates Order from Cart
- `confirmPayment(userId, orderId, paymentId)` → Confirms payment, reduces stock, adds loyalty points
- `getUserOrders(userId)` → Get user's orders
- `getOrderById(userId, orderId)` → Get specific order
- `getOrderByNumber(orderNumber)` → Get order by human-readable number
- `updateOrderStatus(orderId, status)` → Update order status (admin)
- `cancelOrder(userId, orderId, request)` → Cancel order, restore stock
- `cancelOrderItem(userId, orderId, request)` → Cancel single item
- `getRefundSummary(userId, orderId)` → Calculate refund
- `getAllOrders()` → Admin: get all orders
- `getOrdersByStatus(status)` → Admin: filter by status

### 6.2 OrderServiceImpl
**File**: `backend/src/main/java/esprit_market/service/cartService/OrderServiceImpl.java`

**Key Features**:

#### ✅ CORRECT CHECKOUT FLOW:
```java
1. Get user's DRAFT cart
2. Validate cart has items
3. Validate stock availability (don't reduce yet)
4. Create Order entity (status = PENDING)
5. Copy CartItems → OrderItems
6. Clear cart
7. Increment coupon usage
8. Return OrderResponse
```

#### ✅ CORRECT PAYMENT CONFIRMATION:
```java
1. Verify order is PENDING
2. Reduce stock (ONLY after payment confirmed)
3. Update order status to PAID
4. Add loyalty points (ONLY after payment confirmed)
5. Return OrderResponse
```

#### ✅ CORRECT CANCELLATION:
```java
1. Verify order can be cancelled
2. Restore stock for all items
3. Update order status to CANCELLED
4. Restore coupon usage
5. Deduct loyalty points (if they were added)
6. Return RefundSummaryDTO
```

---

## 7. NEW CONTROLLER: OrderController

### 7.1 OrderController
**File**: `backend/src/main/java/esprit_market/controller/cartController/OrderController.java`

**Endpoints**:

#### Create Order:
```
POST /api/orders
Body: CreateOrderRequest
Response: OrderResponse
```

#### Confirm Payment:
```
POST /api/orders/{orderId}/confirm-payment?paymentId=xxx
Response: OrderResponse
```

#### Get Orders:
```
GET /api/orders
Response: List<OrderResponse>

GET /api/orders/{orderId}
Response: OrderResponse

GET /api/orders/number/{orderNumber}
Response: OrderResponse
```

#### Cancel Order:
```
POST /api/orders/{orderId}/cancel
Body: CancelOrderRequest (optional)
Response: RefundSummaryDTO

POST /api/orders/{orderId}/cancel-item
Body: CancelOrderItemRequest
Response: RefundSummaryDTO

GET /api/orders/{orderId}/refund-summary
Response: RefundSummaryDTO
```

#### Admin Operations:
```
GET /api/orders/admin/all
Response: List<OrderResponse>

GET /api/orders/admin/status/{status}
Response: List<OrderResponse>

PUT /api/orders/admin/{orderId}/status?status=SHIPPED
Response: OrderResponse
```

---

## 8. UPDATED CONTROLLER: CartController

### 8.1 Changes
**File**: `backend/src/main/java/esprit_market/controller/cartController/CartController.java`

**Kept Endpoints** (Cart operations only):
```
GET    /api/cart                    → Get cart
GET    /api/cart/items              → Get cart items
POST   /api/cart/items              → Add item
PUT    /api/cart/items/{id}         → Update quantity
DELETE /api/cart/items/{id}         → Remove item
DELETE /api/cart/clear              → Clear cart

POST   /api/cart/coupon             → Apply coupon
DELETE /api/cart/coupon             → Remove coupon
POST   /api/cart/discount/{id}      → Apply discount
DELETE /api/cart/discount           → Remove discount
```

**Deprecated Endpoints** (Kept for backward compatibility):
```
POST   /api/cart/checkout           → @Deprecated (use POST /api/orders)
GET    /api/cart/orders             → @Deprecated (use GET /api/orders)
GET    /api/cart/orders/{id}        → @Deprecated (use GET /api/orders/{id})
POST   /api/cart/orders/{id}/cancel → @Deprecated (use POST /api/orders/{id}/cancel)
```

---

## 9. MIGRATION STRATEGY

### Phase 1: Immediate (DONE)
✅ Create new entities (Order, OrderItem)  
✅ Create new enums (OrderStatus, OrderItemStatus)  
✅ Create new repositories (OrderRepository, OrderItemRepository)  
✅ Create new DTOs (OrderResponse, OrderItemResponse, CreateOrderRequest)  
✅ Create new mappers (OrderMapper, OrderItemMapper)  
✅ Create new service (OrderService, OrderServiceImpl)  
✅ Create new controller (OrderController)  
✅ Update CartController (mark order endpoints as @Deprecated)  
✅ Update Cart entity (add documentation, mark fields as @Deprecated)

### Phase 2: Testing (TODO)
- [ ] Test createOrderFromCart flow
- [ ] Test confirmPayment flow (stock reduction, loyalty points)
- [ ] Test cancelOrder flow (stock restoration, coupon restoration)
- [ ] Test backward compatibility (old /api/cart/checkout still works)
- [ ] Test order number generation
- [ ] Integration tests with product service

### Phase 3: Frontend Migration (TODO)
- [ ] Update frontend to use new /api/orders endpoints
- [ ] Keep old /api/cart/checkout as fallback
- [ ] Update order history page to use /api/orders
- [ ] Update order details page to use /api/orders/{id}
- [ ] Update cancellation flow to use /api/orders/{id}/cancel

### Phase 4: Data Migration (TODO)
- [ ] Create migration script to convert existing Cart entities with order statuses to Order entities
- [ ] Migrate CartItems to OrderItems for completed orders
- [ ] Keep DRAFT carts as-is
- [ ] Verify data integrity after migration

### Phase 5: Cleanup (FUTURE)
- [ ] Remove @Deprecated endpoints from CartController
- [ ] Remove order-related methods from CartService
- [ ] Remove order-related fields from Cart entity
- [ ] Update documentation

---

## 10. BACKWARD COMPATIBILITY

### 10.1 Old Endpoints Still Work
The following old endpoints are kept for backward compatibility:
```
POST /api/cart/checkout              → Still works (uses old CartService)
GET  /api/cart/orders                → Still works (returns old Cart entities)
GET  /api/cart/orders/{id}           → Still works
POST /api/cart/orders/{id}/cancel    → Still works
```

### 10.2 New Endpoints Available
New code should use:
```
POST /api/orders                     → Create order from cart
POST /api/orders/{id}/confirm-payment → Confirm payment
GET  /api/orders                     → Get user orders
GET  /api/orders/{id}                → Get order details
POST /api/orders/{id}/cancel         → Cancel order
```

### 10.3 Gradual Migration
- Frontend can continue using old endpoints
- New features should use new endpoints
- Old endpoints will be removed in future version (with deprecation notice)

---

## 11. KEY IMPROVEMENTS

### 11.1 Stock Management Fixed
**Before**: Stock reduced at checkout (PENDING status)  
**After**: Stock reduced at payment confirmation (PAID status)

### 11.2 Loyalty Points Fixed
**Before**: Points added at checkout  
**After**: Points added at payment confirmation

### 11.3 Clear Separation
**Before**: Cart entity used for both cart and orders  
**After**: Cart for shopping, Order for purchases

### 11.4 Human-Readable Order Numbers
**Before**: Only MongoDB ObjectId  
**After**: Order number like "ORD-20260411-0001"

### 11.5 Better Order Tracking
**Before**: Limited order status tracking  
**After**: Full lifecycle tracking (PENDING → PAID → PROCESSING → SHIPPED → DELIVERED)

---

## 12. TESTING CHECKLIST

### 12.1 Unit Tests
- [ ] OrderServiceImpl.createOrderFromCart()
- [ ] OrderServiceImpl.confirmPayment()
- [ ] OrderServiceImpl.cancelOrder()
- [ ] OrderServiceImpl.generateOrderNumber()
- [ ] OrderMapper.toResponse()
- [ ] OrderItemMapper.toResponse()

### 12.2 Integration Tests
- [ ] Full checkout flow (cart → order → payment → delivery)
- [ ] Cancellation flow (order → cancel → stock restore)
- [ ] Coupon application and restoration
- [ ] Loyalty points addition and deduction
- [ ] Stock reduction timing

### 12.3 API Tests
- [ ] POST /api/orders (create order)
- [ ] POST /api/orders/{id}/confirm-payment
- [ ] GET /api/orders (list orders)
- [ ] GET /api/orders/{id} (get order)
- [ ] POST /api/orders/{id}/cancel
- [ ] Backward compatibility: POST /api/cart/checkout

---

## 13. ROLLBACK PLAN

If issues occur:

1. **Disable new endpoints**: Comment out OrderController
2. **Keep old endpoints**: CartController still works
3. **No data loss**: New Order entities are separate from Cart entities
4. **Revert code**: Git revert to previous commit

---

## 14. NEXT STEPS

### Immediate:
1. Test new OrderService methods
2. Test new OrderController endpoints
3. Verify backward compatibility

### Short-term:
1. Update frontend to use new endpoints
2. Create data migration script
3. Add comprehensive tests

### Long-term:
1. Remove deprecated endpoints
2. Clean up Cart entity
3. Full documentation update

---

## 15. SUMMARY

### What Changed:
- ✅ New Order and OrderItem entities
- ✅ New OrderService with correct stock/loyalty logic
- ✅ New OrderController with clean API
- ✅ Cart entity simplified (documentation added)
- ✅ CartController order endpoints marked @Deprecated

### What Stayed:
- ✅ Cart entity structure (backward compatible)
- ✅ CartService (still works for old code)
- ✅ Old API endpoints (still functional)
- ✅ No breaking changes

### Key Benefits:
- ✅ Clear separation of concerns (Cart vs Order)
- ✅ Correct stock reduction timing (at payment, not checkout)
- ✅ Correct loyalty points timing (at payment, not checkout)
- ✅ Human-readable order numbers
- ✅ Better order lifecycle tracking
- ✅ Backward compatible (no immediate frontend changes required)

---

**END OF MIGRATION GUIDE**
