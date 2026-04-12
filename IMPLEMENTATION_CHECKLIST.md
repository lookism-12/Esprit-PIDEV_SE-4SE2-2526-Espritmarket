# CART/ORDER REFACTOR - IMPLEMENTATION CHECKLIST

**Date**: 2026-04-11  
**Status**: Implementation Complete, Testing Required

---

## ✅ PHASE 1: ENTITIES & ENUMS (COMPLETE)

- [x] Create `Order` entity
- [x] Create `OrderItem` entity
- [x] Update `Cart` entity with documentation
- [x] Create `OrderStatus` enum
- [x] Create `OrderItemStatus` enum
- [x] Mark deprecated fields in Cart entity

---

## ✅ PHASE 2: REPOSITORIES (COMPLETE)

- [x] Create `OrderRepository`
- [x] Create `OrderItemRepository`
- [x] Add query methods for orders by user
- [x] Add query methods for orders by status
- [x] Add query method for order by number

---

## ✅ PHASE 3: DTOs & MAPPERS (COMPLETE)

- [x] Create `OrderResponse` DTO
- [x] Create `OrderItemResponse` DTO
- [x] Create `CreateOrderRequest` DTO
- [x] Create `OrderMapper`
- [x] Create `OrderItemMapper`

---

## ✅ PHASE 4: SERVICE LAYER (COMPLETE)

- [x] Create `IOrderService` interface
- [x] Create `OrderServiceImpl` implementation
- [x] Implement `createOrderFromCart()` method
- [x] Implement `confirmPayment()` method (stock reduction + loyalty points)
- [x] Implement `getUserOrders()` method
- [x] Implement `getOrderById()` method
- [x] Implement `getOrderByNumber()` method
- [x] Implement `cancelOrder()` method (stock restoration)
- [x] Implement `cancelOrderItem()` method
- [x] Implement `getRefundSummary()` method
- [x] Implement `updateOrderStatus()` method (admin)
- [x] Implement order number generation

---

## ✅ PHASE 5: CONTROLLER LAYER (COMPLETE)

- [x] Create `OrderController`
- [x] Add `POST /api/orders` endpoint
- [x] Add `POST /api/orders/{id}/confirm-payment` endpoint
- [x] Add `GET /api/orders` endpoint
- [x] Add `GET /api/orders/{id}` endpoint
- [x] Add `GET /api/orders/number/{orderNumber}` endpoint
- [x] Add `POST /api/orders/{id}/cancel` endpoint
- [x] Add `POST /api/orders/{id}/cancel-item` endpoint
- [x] Add `GET /api/orders/{id}/refund-summary` endpoint
- [x] Add admin endpoints (all orders, filter by status, update status)
- [x] Update `CartController` (mark order endpoints as @Deprecated)
- [x] Create `ProviderOrderController`
- [x] Fix `ProviderDashboardController` to read from Order collection

---

## ✅ PHASE 6: DOCUMENTATION (COMPLETE)

- [x] Create `CART_MODULE_ANALYSIS.md`
- [x] Create `CART_ORDER_REFACTOR_MIGRATION_GUIDE.md`
- [x] Create `REFACTOR_SUMMARY.md`
- [x] Create `API_ENDPOINTS_COMPARISON.md`
- [x] Create `IMPLEMENTATION_CHECKLIST.md`
- [x] Create `CHECKOUT_ARCHITECTURE_FIX.md`
- [x] Create `CHECKOUT_FIX_COMPLETE.md`
- [x] Create `PROVIDER_DASHBOARD_FIX_COMPLETE.md`

---

## ⏳ PHASE 7: TESTING (TODO)

### Unit Tests:
- [ ] Test `OrderServiceImpl.createOrderFromCart()`
  - [ ] Happy path: cart with items → order created
  - [ ] Error: empty cart
  - [ ] Error: user not found
  - [ ] Verify cart is cleared after order creation
  - [ ] Verify coupon usage incremented

- [ ] Test `OrderServiceImpl.confirmPayment()`
  - [ ] Happy path: PENDING → PAID
  - [ ] Verify stock reduced
  - [ ] Verify loyalty points added
  - [ ] Error: order not PENDING
  - [ ] Error: order not found
  - [ ] Error: order doesn't belong to user

- [ ] Test `OrderServiceImpl.cancelOrder()`
  - [ ] Happy path: order cancelled
  - [ ] Verify stock restored
  - [ ] Verify coupon usage decremented
  - [ ] Verify loyalty points deducted
  - [ ] Error: order already cancelled
  - [ ] Error: order not found

- [ ] Test `OrderServiceImpl.generateOrderNumber()`
  - [ ] Verify format: ORD-YYYYMMDD-XXXX
  - [ ] Verify uniqueness
  - [ ] Verify sequential numbering

- [ ] Test `OrderMapper.toResponse()`
  - [ ] Verify all fields mapped correctly
  - [ ] Verify ObjectId → String conversion
  - [ ] Verify null handling

- [ ] Test `OrderItemMapper.toResponse()`
  - [ ] Verify all fields mapped correctly
  - [ ] Verify ObjectId → String conversion

### Integration Tests:
- [ ] Test full checkout flow
  - [ ] Add items to cart
  - [ ] Apply coupon
  - [ ] Create order (POST /api/orders)
  - [ ] Verify order status = PENDING
  - [ ] Verify stock NOT reduced yet
  - [ ] Confirm payment (POST /api/orders/{id}/confirm-payment)
  - [ ] Verify order status = PAID
  - [ ] Verify stock reduced
  - [ ] Verify loyalty points added
  - [ ] Verify cart cleared

- [ ] Test cancellation flow
  - [ ] Create order
  - [ ] Confirm payment
  - [ ] Cancel order (POST /api/orders/{id}/cancel)
  - [ ] Verify order status = CANCELLED
  - [ ] Verify stock restored
  - [ ] Verify coupon usage restored
  - [ ] Verify loyalty points deducted

- [ ] Test backward compatibility
  - [ ] Old endpoint: POST /api/cart/checkout still works
  - [ ] Old endpoint: GET /api/cart/orders still works
  - [ ] Old endpoint: POST /api/cart/orders/{id}/cancel still works

- [ ] Test order lifecycle
  - [ ] PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
  - [ ] Verify status transitions
  - [ ] Verify timestamps updated

### API Tests:
- [ ] Test POST /api/orders
  - [ ] Valid request → 201 Created
  - [ ] Empty cart → 400 Bad Request
  - [ ] Invalid shipping address → 400 Bad Request
  - [ ] Unauthorized → 401 Unauthorized

- [ ] Test POST /api/orders/{id}/confirm-payment
  - [ ] Valid request → 200 OK
  - [ ] Order not PENDING → 400 Bad Request
  - [ ] Order not found → 404 Not Found
  - [ ] Order doesn't belong to user → 403 Forbidden

- [ ] Test GET /api/orders
  - [ ] Returns user's orders
  - [ ] Sorted by creation date (newest first)
  - [ ] Empty list if no orders

- [ ] Test GET /api/orders/{id}
  - [ ] Valid ID → 200 OK
  - [ ] Invalid ID → 404 Not Found
  - [ ] Order doesn't belong to user → 403 Forbidden

- [ ] Test GET /api/orders/number/{orderNumber}
  - [ ] Valid order number → 200 OK
  - [ ] Invalid order number → 404 Not Found

- [ ] Test POST /api/orders/{id}/cancel
  - [ ] Valid request → 200 OK
  - [ ] Order already cancelled → 400 Bad Request
  - [ ] Order not found → 404 Not Found

- [ ] Test admin endpoints
  - [ ] GET /api/orders/admin/all (admin only)
  - [ ] GET /api/orders/admin/status/{status} (admin only)
  - [ ] PUT /api/orders/admin/{id}/status (admin only)
  - [ ] Non-admin user → 403 Forbidden

---

## ⏳ PHASE 8: FRONTEND MIGRATION (TODO)

### Update Order Creation:
- [ ] Replace `/api/cart/checkout` with `/api/orders`
- [ ] Add payment confirmation step
- [ ] Call `/api/orders/{id}/confirm-payment` after payment gateway confirms
- [ ] Update order creation UI to show order number

### Update Order List:
- [ ] Replace `/api/cart/orders` with `/api/orders`
- [ ] Update order list component to use OrderResponse
- [ ] Display order numbers instead of just IDs
- [ ] Add order status badges

### Update Order Details:
- [ ] Replace `/api/cart/orders/{id}` with `/api/orders/{id}`
- [ ] Update order details component to use OrderResponse
- [ ] Display order number prominently
- [ ] Show payment ID if available
- [ ] Show order items from response

### Update Order Cancellation:
- [ ] Replace `/api/cart/orders/{id}/cancel` with `/api/orders/{id}/cancel`
- [ ] Update cancellation UI
- [ ] Show refund summary

### Add Admin Features:
- [ ] Create admin order management page
- [ ] Use `/api/orders/admin/all` to list all orders
- [ ] Add status filter using `/api/orders/admin/status/{status}`
- [ ] Add status update using `/api/orders/admin/{id}/status`

---

## ⏳ PHASE 9: DATA MIGRATION (TODO)

### Migration Script:
- [ ] Create migration script to convert existing Cart entities with order statuses to Order entities
- [ ] Identify all Cart entities with status != DRAFT
- [ ] For each Cart with order status:
  - [ ] Create corresponding Order entity
  - [ ] Generate order number
  - [ ] Copy all fields
  - [ ] Find CartItems by cartId
  - [ ] Create OrderItems from CartItems
  - [ ] Mark original Cart as migrated (add flag)
- [ ] Verify data integrity after migration
- [ ] Create rollback script

### Migration Steps:
- [ ] Backup database
- [ ] Run migration script in test environment
- [ ] Verify migrated data
- [ ] Run migration script in production
- [ ] Monitor for issues
- [ ] Keep old Cart entities for 30 days (safety)
- [ ] Delete old Cart entities after verification

---

## ⏳ PHASE 10: CLEANUP (FUTURE)

### Remove Deprecated Code:
- [ ] Remove @Deprecated endpoints from CartController
  - [ ] POST /api/cart/checkout
  - [ ] GET /api/cart/orders
  - [ ] GET /api/cart/orders/{id}
  - [ ] POST /api/cart/orders/{id}/cancel
  - [ ] POST /api/cart/orders/{id}/cancel-item
  - [ ] GET /api/cart/orders/{id}/refund-summary

- [ ] Remove order-related methods from CartService
  - [ ] checkout()
  - [ ] getUserOrders()
  - [ ] getOrderById()
  - [ ] cancelOrder()
  - [ ] cancelOrderItem()
  - [ ] getRefundSummary()

- [ ] Remove @Deprecated fields from Cart entity
  - [ ] shippingAddress
  - [ ] paymentMethod
  - [ ] orderDate

- [ ] Update CartStatus enum (remove order statuses)
  - [ ] Remove PENDING
  - [ ] Remove CONFIRMED
  - [ ] Remove PAID
  - [ ] Remove PROCESSING
  - [ ] Remove SHIPPED
  - [ ] Remove DELIVERED
  - [ ] Remove CANCELLED
  - [ ] Remove REFUNDED
  - [ ] Keep only DRAFT

---

## ⏳ PHASE 11: MONITORING & OPTIMIZATION (FUTURE)

### Monitoring:
- [ ] Add logging for order creation
- [ ] Add logging for payment confirmation
- [ ] Add logging for stock reduction
- [ ] Add logging for loyalty points
- [ ] Add metrics for order status transitions
- [ ] Add alerts for failed payments
- [ ] Add alerts for stock issues

### Optimization:
- [ ] Add caching for order list
- [ ] Add pagination for order list
- [ ] Add search functionality for orders
- [ ] Add filtering by date range
- [ ] Add filtering by status
- [ ] Optimize order number generation
- [ ] Add indexes for frequently queried fields

---

## CRITICAL FIXES IMPLEMENTED

### ✅ Stock Management Fixed:
**Before**: Stock reduced at checkout (PENDING status)  
**After**: Stock reduced at payment confirmation (PAID status)

### ✅ Loyalty Points Fixed:
**Before**: Points added at checkout  
**After**: Points added at payment confirmation

### ✅ Clear Separation:
**Before**: Cart entity used for both cart and orders  
**After**: Cart for shopping, Order for purchases

### ✅ Backward Compatible:
**Before**: Breaking changes would affect frontend  
**After**: Old endpoints still work, gradual migration possible

### ✅ Checkout Creates Order Entities:
**Before**: Checkout only updated Cart status (DRAFT → PENDING)  
**After**: Checkout creates Order + OrderItem documents in MongoDB

### ✅ Provider Dashboard Reads from Order Collection:
**Before**: ProviderDashboardController read from Cart collection (empty results)  
**After**: ProviderDashboardController reads from Order collection (correct data)

---

## RISK ASSESSMENT

### Low Risk:
- ✅ New entities don't affect existing Cart entities
- ✅ New endpoints don't conflict with existing endpoints
- ✅ Old endpoints still work (backward compatible)
- ✅ No database schema changes required

### Medium Risk:
- ⚠️ Frontend needs to be updated to use new endpoints
- ⚠️ Data migration required for existing orders
- ⚠️ Testing required to ensure stock reduction timing is correct

### High Risk:
- ❌ None (minimal impact design)

---

## ROLLBACK PLAN

If critical issues occur:

1. **Immediate Rollback**:
   - Comment out `@RestController` in OrderController
   - Old CartController endpoints still work
   - No data loss (Order entities are separate)

2. **Code Rollback**:
   - Git revert to previous commit
   - Redeploy application
   - No database changes needed

3. **Data Rollback**:
   - If migration was run, use rollback script
   - Restore from backup if needed

---

## SUCCESS CRITERIA

### Must Have:
- [x] Order entity created
- [x] OrderService implemented
- [x] OrderController created
- [x] Stock reduction happens at payment confirmation
- [x] Loyalty points added at payment confirmation
- [x] Backward compatibility maintained
- [ ] All tests passing
- [ ] Frontend updated

### Nice to Have:
- [ ] Order number generation
- [ ] Admin order management
- [ ] Order search functionality
- [ ] Order filtering
- [ ] Performance optimization

---

## TIMELINE

### Week 1 (Current):
- [x] Implementation complete
- [ ] Unit tests
- [ ] Integration tests

### Week 2:
- [ ] Frontend migration
- [ ] API testing
- [ ] Bug fixes

### Week 3:
- [ ] Data migration script
- [ ] Test migration in staging
- [ ] Performance testing

### Week 4:
- [ ] Production deployment
- [ ] Monitor for issues
- [ ] Documentation update

### Month 2-3:
- [ ] Gradual frontend migration
- [ ] User feedback
- [ ] Optimization

### Month 4-6:
- [ ] Remove deprecated endpoints
- [ ] Cleanup old code
- [ ] Final documentation

---

## NOTES

- Implementation is complete and backward compatible
- Old endpoints still work (no breaking changes)
- Frontend can migrate gradually
- Data migration can be done separately
- Critical bugs (stock timing, loyalty points) are fixed in new code
- Old code still has bugs but continues to work for backward compatibility

---

**END OF CHECKLIST**
