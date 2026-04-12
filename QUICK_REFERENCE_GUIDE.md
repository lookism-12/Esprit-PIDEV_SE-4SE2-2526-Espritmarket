# CART/ORDER SYSTEM - QUICK REFERENCE GUIDE

**Last Updated**: 2026-04-11

---

## FOR FRONTEND DEVELOPERS

### Shopping Cart Operations

```typescript
// Get cart
GET /api/cart
→ Returns: CartResponse

// Add item to cart
POST /api/cart/items
Body: { productId: "xxx", quantity: 2 }
→ Returns: CartItemResponse

// Update quantity
PUT /api/cart/items/{cartItemId}
Body: { quantity: 5 }
→ Returns: CartItemResponse

// Remove item
DELETE /api/cart/items/{cartItemId}
→ Returns: 204 No Content

// Apply coupon
POST /api/cart/coupon
Body: { couponCode: "SAVE10" }
→ Returns: CartResponse

// Clear cart
DELETE /api/cart/clear
→ Returns: 204 No Content
```

### Order Operations (NEW - Use These!)

```typescript
// 1. Create order from cart
POST /api/orders
Body: {
  shippingAddress: "123 Main St",
  paymentMethod: "CREDIT_CARD",
  notes: "Leave at door"
}
→ Returns: OrderResponse (status = PENDING)

// 2. Confirm payment (after payment gateway confirms)
POST /api/orders/{orderId}/confirm-payment?paymentId=pay_123456
→ Returns: OrderResponse (status = PAID)
// ✅ Stock is reduced HERE
// ✅ Loyalty points added HERE

// 3. Get user's orders
GET /api/orders
→ Returns: List<OrderResponse>

// 4. Get order details
GET /api/orders/{orderId}
→ Returns: OrderResponse (with items)

// 5. Cancel order
POST /api/orders/{orderId}/cancel
Body: { reason: "Changed my mind" }
→ Returns: RefundSummaryDTO

// 6. Cancel specific item
POST /api/orders/{orderId}/cancel-item
Body: { cartItemId: "xxx", quantity: 1, reason: "Wrong size" }
→ Returns: RefundSummaryDTO

// 7. Get refund summary
GET /api/orders/{orderId}/refund-summary
→ Returns: RefundSummaryDTO
```

### Old Endpoints (Deprecated - Still Work)

```typescript
// ⚠️ These still work but are deprecated
POST /api/cart/checkout  // Use POST /api/orders instead
GET /api/cart/orders     // Use GET /api/orders instead
```

---

## FOR BACKEND DEVELOPERS

### Service Layer

#### CartService - Shopping Cart Only

```java
@Autowired
private ICartService cartService;

// Get or create cart
CartResponse cart = cartService.getOrCreateCart(userId);

// Add item
AddToCartRequest request = new AddToCartRequest();
request.setProductId(productId);
request.setQuantity(2);
CartItemResponse item = cartService.addProductToCart(userId, request);

// Apply coupon
ApplyCouponRequest couponReq = new ApplyCouponRequest();
couponReq.setCouponCode("SAVE10");
CartResponse updated = cartService.applyCoupon(userId, couponReq);
```

#### OrderService - Order Lifecycle

```java
@Autowired
private IOrderService orderService;

// Create order from cart
CreateOrderRequest request = new CreateOrderRequest();
request.setShippingAddress("123 Main St");
request.setPaymentMethod("CREDIT_CARD");
OrderResponse order = orderService.createOrderFromCart(userId, request);
// Order status = PENDING
// Stock NOT reduced yet

// Confirm payment (after payment gateway confirms)
OrderResponse paidOrder = orderService.confirmPayment(userId, orderId, paymentId);
// Order status = PAID
// ✅ Stock reduced HERE
// ✅ Loyalty points added HERE

// Get orders
List<OrderResponse> orders = orderService.getUserOrders(userId);

// Cancel order
CancelOrderRequest cancelReq = new CancelOrderRequest();
cancelReq.setReason("Changed my mind");
RefundSummaryDTO refund = orderService.cancelOrder(userId, orderId, cancelReq);
// Stock restored
// Coupon usage restored
// Loyalty points deducted
```

---

## CHECKOUT FLOW

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER SHOPPING                                             │
│    - Browse products                                         │
│    - Add to cart (POST /api/cart/items)                     │
│    - Update quantities                                       │
│    - Apply coupon (optional)                                 │
│    Cart status: DRAFT                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CHECKOUT                                                  │
│    POST /api/orders                                          │
│    Body: { shippingAddress, paymentMethod }                 │
│                                                              │
│    Backend:                                                  │
│    - Validate stock availability (don't reduce)             │
│    - Create Order entity (status = PENDING)                 │
│    - Copy CartItems → OrderItems                            │
│    - Generate order number (ORD-20260411-0001)              │
│    - Clear cart                                              │
│    - Increment coupon usage                                  │
│                                                              │
│    Returns: OrderResponse (status = PENDING)                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PAYMENT GATEWAY                                           │
│    - User enters payment details                             │
│    - Payment gateway processes payment                       │
│    - Payment gateway returns paymentId                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PAYMENT CONFIRMATION                                      │
│    POST /api/orders/{orderId}/confirm-payment?paymentId=xxx │
│                                                              │
│    Backend:                                                  │
│    - Verify order is PENDING                                 │
│    - ✅ REDUCE STOCK (ONLY NOW!)                            │
│    - Update order status to PAID                             │
│    - ✅ ADD LOYALTY POINTS (ONLY NOW!)                      │
│    - Save payment ID                                         │
│                                                              │
│    Returns: OrderResponse (status = PAID)                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ORDER FULFILLMENT                                         │
│    - PAID → PROCESSING (seller prepares)                    │
│    - PROCESSING → SHIPPED (order shipped)                   │
│    - SHIPPED → DELIVERED (order delivered)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## KEY RULES

### ✅ DO:
1. Use `/api/orders` for all order operations
2. Call `confirmPayment()` after payment gateway confirms
3. Reduce stock ONLY in `confirmPayment()`
4. Add loyalty points ONLY in `confirmPayment()`
5. Use Order entity for completed purchases
6. Use Cart entity for shopping basket only

### ❌ DON'T:
1. Don't use `/api/cart/checkout` (deprecated)
2. Don't reduce stock during order creation
3. Don't add loyalty points during order creation
4. Don't use Cart entity for orders
5. Don't mix cart and order logic

---

## STATUS ENUMS

### CartStatus (Cart Entity)
```java
DRAFT    // Active shopping cart
ACTIVE   // Alternative to DRAFT
```

### OrderStatus (Order Entity)
```java
PENDING              // Order created, waiting for payment
PAID                 // Payment confirmed, stock reduced
PROCESSING           // Order being prepared
SHIPPED              // Order shipped
DELIVERED            // Order delivered
CANCELLED            // Order cancelled
PARTIALLY_CANCELLED  // Some items cancelled
REFUNDED             // Order refunded
```

### CartItemStatus (CartItem Entity)
```java
ACTIVE   // Item in cart
```

### OrderItemStatus (OrderItem Entity)
```java
ACTIVE               // Item in order
CANCELLED            // Item cancelled
PARTIALLY_CANCELLED  // Partial quantity cancelled
REFUNDED             // Item refunded
```

---

## COMMON SCENARIOS

### Scenario 1: User Completes Purchase

```typescript
// 1. User adds items to cart
POST /api/cart/items { productId: "A", quantity: 2 }
POST /api/cart/items { productId: "B", quantity: 1 }

// 2. User applies coupon
POST /api/cart/coupon { couponCode: "SAVE10" }

// 3. User clicks checkout
POST /api/orders {
  shippingAddress: "123 Main St",
  paymentMethod: "CREDIT_CARD"
}
→ Returns: { id: "order123", status: "PENDING", orderNumber: "ORD-20260411-0001" }

// 4. User completes payment
POST /api/orders/order123/confirm-payment?paymentId=pay_456
→ Returns: { id: "order123", status: "PAID" }
// ✅ Stock reduced
// ✅ Loyalty points added

// 5. User views order
GET /api/orders/order123
→ Returns: Full order details with items
```

### Scenario 2: User Cancels Order

```typescript
// 1. User views orders
GET /api/orders
→ Returns: List of orders

// 2. User cancels order
POST /api/orders/order123/cancel {
  reason: "Changed my mind"
}
→ Returns: RefundSummaryDTO
// ✅ Stock restored
// ✅ Coupon usage restored
// ✅ Loyalty points deducted
```

### Scenario 3: User Cancels Single Item

```typescript
// 1. User views order details
GET /api/orders/order123
→ Returns: Order with multiple items

// 2. User cancels one item
POST /api/orders/order123/cancel-item {
  cartItemId: "item456",
  quantity: 1,
  reason: "Wrong size"
}
→ Returns: RefundSummaryDTO
// ✅ Stock restored for that item
// ✅ Loyalty points deducted proportionally
```

---

## TROUBLESHOOTING

### Issue: "Ambiguous mapping" error
**Solution**: Old `OrderStatusController` was moved to `/api/cart/orders`. Make sure you're using `/api/orders` for new endpoints.

### Issue: Stock not reducing
**Solution**: Make sure you're calling `POST /api/orders/{id}/confirm-payment` after payment, not just creating the order.

### Issue: Loyalty points not added
**Solution**: Loyalty points are added in `confirmPayment()`, not during order creation.

### Issue: Old endpoints not working
**Solution**: Old endpoints moved to `/api/cart/orders/*`. Update your code to use `/api/orders/*` instead.

---

## MIGRATION CHECKLIST

### For Frontend:
- [ ] Replace `POST /api/cart/checkout` with `POST /api/orders`
- [ ] Add payment confirmation step (`POST /api/orders/{id}/confirm-payment`)
- [ ] Replace `GET /api/cart/orders` with `GET /api/orders`
- [ ] Replace `GET /api/cart/orders/{id}` with `GET /api/orders/{id}`
- [ ] Replace `POST /api/cart/orders/{id}/cancel` with `POST /api/orders/{id}/cancel`
- [ ] Update order list component to use OrderResponse
- [ ] Update order details component to use OrderResponse
- [ ] Display order numbers instead of just IDs

### For Backend:
- [x] Create Order and OrderItem entities
- [x] Create OrderRepository and OrderItemRepository
- [x] Create IOrderService and OrderServiceImpl
- [x] Create OrderController
- [x] Clean ICartService (mark order methods as @Deprecated)
- [x] Move OrderStatusController to /api/cart/orders
- [x] Implement stock reduction in confirmPayment()
- [x] Implement loyalty points in confirmPayment()
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Update API documentation

---

**END OF QUICK REFERENCE**
