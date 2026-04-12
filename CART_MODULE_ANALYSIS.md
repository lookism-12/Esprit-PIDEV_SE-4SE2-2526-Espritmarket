# CART MODULE ARCHITECTURE ANALYSIS

**Project**: ESPRIT Market  
**Module**: CART (Shopping Cart, Orders, Coupons, Discounts, Loyalty)  
**Analysis Date**: 2026-04-11  
**Constraint**: Minimal fixes only - NO full redesign

---

## 1. ENTITY RELATIONSHIP DIAGRAM (Current Implementation)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER (from user module)                    │
│  - id: ObjectId                                                      │
│  - email, firstName, lastName, role                                  │
└──────────────────┬──────────────────────────────────────────────────┘
                   │
                   │ @DBRef (1:N)
                   │
    ┌──────────────┴──────────────┬──────────────────┬────────────────┐
    │                              │                  │                │
    ▼                              ▼                  ▼                ▼
┌───────────────┐          ┌──────────────┐   ┌─────────────┐  ┌──────────────┐
│   CART        │          │  COUPONS     │   │  DISCOUNT   │  │ LOYALTYCARD  │
│ (DUAL ROLE!)  │          │              │   │             │  │              │
├───────────────┤          ├──────────────┤   ├─────────────┤  ├──────────────┤
│ id            │          │ id           │   │ id          │  │ id           │
│ user @DBRef   │◄─────────│ userId       │   │ name        │  │ user @DBRef  │
│ status        │          │ code         │   │ percentage  │  │ points       │
│ totalAmount   │          │ discountType │   │ fixedAmount │  │ level        │
│ discountAmt   │          │ discountVal  │   │ startDate   │  │ totalPoints  │
│ finalAmount   │          │ minCartAmt   │   │ endDate     │  │ pointsExpire │
│ couponCode    │          │ usageLimit   │   │ active      │  │ convertedTo  │
│ discountId    │          │ usageCount   │   │ categoryIds │  │   Discount   │
│ createdAt     │          │ expirationDt │   │ autoActivate│  └──────────────┘
│ lastUpdated   │          │ active       │   └─────────────┘
│ shippingAddr  │          │ eligibleLvl  │
│ paymentMethod │          │ combinable   │
│ orderDate     │          └──────────────┘
└───────┬───────┘
        │
        │ (1:N) - cartId stored in CartItem
        │
        ▼
┌───────────────────┐
│   CARTITEM        │
├───────────────────┤
│ id                │
│ cartId            │◄──── References Cart.id (NOT @DBRef!)
│ productId         │
│ productName       │
│ productPrice      │
│ quantity          │
│ subtotal          │
│ status            │
│ cancelledQty      │
│ refundedAmount    │
└───────────────────┘
```

### Key Relationships:

1. **User → Cart**: `1:N` via `@DBRef User user`
2. **User → Coupons**: `1:N` via `ObjectId userId` (NOT @DBRef)
3. **User → LoyaltyCard**: `1:1` via `@DBRef User user`
4. **Cart → CartItem**: `1:N` via `ObjectId cartId` (NOT @DBRef)
5. **Cart → Coupons**: `N:1` via `String couponCode` (loose coupling)
6. **Cart → Discount**: `N:1` via `ObjectId discountId` (NOT @DBRef)

---

## 2. ENTITY DETAILS

### 2.1 Cart Entity
**File**: `backend/src/main/java/esprit_market/entity/cart/Cart.java`

**Attributes**:
```java
@Id ObjectId id
@DBRef User user                    // ✅ Strong reference
CartStatus status                   // ⚠️ DUAL ROLE: DRAFT + ORDER statuses
Double totalAmount
Double discountAmount
Double finalAmount
String couponCode                   // ⚠️ Weak reference (String, not @DBRef)
ObjectId discountId                 // ⚠️ Weak reference (not @DBRef)
LocalDateTime createdAt
LocalDateTime lastUpdated
String shippingAddress
String paymentMethod
LocalDateTime orderDate
```

**Status Lifecycle**:
```
DRAFT → PENDING → CONFIRMED/PAID → PROCESSING → SHIPPED → DELIVERED
                      ↓
                  CANCELLED / REFUNDED / PARTIALLY_CANCELLED
```

**⚠️ CRITICAL ISSUE**: Cart is used for BOTH:
- **Shopping Cart** (status = DRAFT)
- **Order** (status = PENDING, CONFIRMED, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED)

### 2.2 CartItem Entity
**File**: `backend/src/main/java/esprit_market/entity/cart/CartItem.java`

**Attributes**:
```java
@Id ObjectId id
ObjectId cartId                     // ⚠️ NOT @DBRef (weak reference)
ObjectId productId                  // ⚠️ NOT @DBRef (weak reference)
String productName                  // Denormalized
Double productPrice                 // Denormalized
Integer quantity
Double subtotal
CartItemStatus status               // ACTIVE, CANCELLED, PARTIALLY_CANCELLED, REFUNDED
Integer cancelledQuantity
Double refundedAmount
```

**⚠️ ISSUES**:
- `cartId` is NOT `@DBRef` → No automatic cascade delete
- `productId` is NOT `@DBRef` → Product changes don't reflect
- Denormalized fields (`productName`, `productPrice`) → Data inconsistency risk

### 2.3 Coupons Entity
**File**: `backend/src/main/java/esprit_market/entity/cart/Coupons.java`

**Attributes**:
```java
@Id ObjectId id
ObjectId userId                     // ⚠️ NOT @DBRef (weak reference)
String code                         // Unique identifier
String discountType                 // PERCENTAGE, FIXED
Double discountValue
Double minCartAmount
Integer usageLimit
Integer usageCount
LocalDate expirationDate
Boolean active
String eligibleUserLevel            // BRONZE, SILVER, GOLD, PLATINUM
Boolean combinableWithDiscount
```

**⚠️ ISSUES**:
- `userId` is NOT `@DBRef` → No automatic user validation
- Cart references coupon via `String couponCode` → Weak coupling

### 2.4 Discount Entity
**File**: `backend/src/main/java/esprit_market/entity/cart/Discount.java`

**Attributes**:
```java
@Id ObjectId id
String name
Double percentage
Double fixedAmount
LocalDate startDate
LocalDate endDate
Boolean active
List<ObjectId> categoryIds          // ⚠️ NOT @DBRef (weak reference)
Boolean autoActivate
```

**⚠️ ISSUES**:
- `categoryIds` are NOT `@DBRef` → No category validation
- Cart references discount via `ObjectId discountId` → Weak coupling

### 2.5 LoyaltyCard Entity
**File**: `backend/src/main/java/esprit_market/entity/cart/LoyaltyCard.java`

**Attributes**:
```java
@Id ObjectId id
@DBRef User user                    // ✅ Strong reference
Integer points
String level                        // BRONZE, SILVER, GOLD, PLATINUM
Integer totalPointsEarned
LocalDate pointsExpireAt
Double convertedToDiscount
```

**✅ GOOD**: Properly uses `@DBRef` for User relationship

---

## 3. STATUS ENUMS

### 3.1 CartStatus
**File**: `backend/src/main/java/esprit_market/Enum/cartEnum/CartStatus.java`

```java
DRAFT                   // Shopping cart (active cart)
PENDING                 // Order placed, waiting for payment
CONFIRMED               // Payment confirmed, stock reduced
PAID                    // Alternative confirmed status
PROCESSING              // Order being prepared
SHIPPED                 // Order shipped
DELIVERED               // Order delivered
CANCELLED               // Order cancelled, stock restored
PARTIALLY_CANCELLED     // Some items cancelled
PARTIALLY_REFUNDED      // Some items refunded
REFUNDED                // Full refund, stock restored
```

**⚠️ ISSUE**: Mixing cart states (DRAFT) with order states (all others)

### 3.2 CartItemStatus
**File**: `backend/src/main/java/esprit_market/Enum/cartEnum/CartItemStatus.java`

```java
ACTIVE                  // Item in cart/order
CANCELLED               // Item cancelled
PARTIALLY_CANCELLED     // Partial quantity cancelled
REFUNDED                // Item refunded
```

---

## 4. SERVICE LAYER ANALYSIS

### 4.1 CartServiceImpl
**File**: `backend/src/main/java/esprit_market/service/cartService/CartServiceImpl.java`

**Key Methods**:
- `getOrCreateCart(userId)` → Returns DRAFT cart or creates new one
- `addProductToCart(userId, request)` → Adds item to DRAFT cart
- `applyCoupon(userId, request)` → Validates and applies coupon
- `applyDiscount(userId, discountId)` → Applies discount
- `checkout(userId, request)` → **CRITICAL**: Converts DRAFT → PENDING, reduces stock
- `cancelOrder(userId, orderId, request)` → Cancels order, restores stock
- `cancelOrderItem(userId, orderId, request)` → Cancels specific item

**⚠️ CRITICAL ISSUES**:

1. **Stock Reduction Timing**:
```java
// In checkout() method:
cart.setStatus(CartStatus.PENDING);  // ⚠️ Stock reduced at PENDING, not CONFIRMED!
productService.reduceStock(item.getProductId(), item.getQuantity());
```
**Problem**: Stock is reduced when order is PENDING (not yet paid), not when CONFIRMED/PAID.

2. **Cart vs Order Confusion**:
```java
// Same entity used for both cart and orders
Cart cart = cartRepository.findByUserAndStatus(user, CartStatus.DRAFT)
    .orElseGet(() -> createNewCart(user));
```

3. **Coupon/Discount Combination Logic**:
```java
// In applyCoupon():
if (cart.getDiscountId() != null) {
    if (!couponService.canCombineWithDiscount(request.getCouponCode())) {
        throw new IllegalStateException("Cannot combine coupon with existing discount");
    }
}
```
**Good**: Validates combination rules, but logic is scattered.

4. **Multiple DRAFT Carts Issue**:
```java
// Repository method can return non-unique result
Optional<Cart> findByUserAndStatus(User user, CartStatus status);
```
**Problem**: If multiple DRAFT carts exist, query fails with "non unique result".

### 4.2 CouponsServiceImpl
**File**: `backend/src/main/java/esprit_market/service/cartService/CouponsServiceImpl.java`

**Key Features**:
- ✅ Comprehensive validation (active, expired, usage limit, min amount, user level)
- ✅ User level hierarchy (PLATINUM > GOLD > SILVER > BRONZE)
- ✅ Combination rules (`combinableWithDiscount` flag)
- ✅ Usage tracking (`incrementCouponUsage`, `decrementCouponUsage`)

**⚠️ ISSUE**: Coupon validation is separate from cart calculation → potential race conditions

### 4.3 DiscountServiceImpl
**File**: `backend/src/main/java/esprit_market/service/cartService/DiscountServiceImpl.java`

**Key Features**:
- ✅ Date range validation
- ✅ Auto-deactivation of expired discounts
- ✅ Category-based discounts

**⚠️ ISSUE**: No validation if discount can be combined with coupons

### 4.4 LoyaltyCardServiceImpl
**File**: `backend/src/main/java/esprit_market/service/cartService/LoyaltyCardServiceImpl.java`

**Key Features**:
- ✅ Points calculation based on cart total
- ✅ Level-based multipliers (BRONZE: 1x, SILVER: 1.5x, GOLD: 2x, PLATINUM: 3x)
- ✅ Points to discount conversion (100 points = 1 currency unit)
- ✅ Automatic level upgrade based on total points earned

**Constants**:
```java
POINTS_PER_CURRENCY_UNIT = 10
POINTS_TO_DISCOUNT_RATIO = 100
BRONZE_MULTIPLIER = 1.0
SILVER_MULTIPLIER = 1.5
GOLD_MULTIPLIER = 2.0
PLATINUM_MULTIPLIER = 3.0
```

**⚠️ ISSUE**: Points are added in `addPointsForCart()` but unclear when this is called (after payment? after delivery?)

---

## 5. CONTROLLER LAYER ANALYSIS

### 5.1 CartController
**File**: `backend/src/main/java/esprit_market/controller/cartController/CartController.java`

**Endpoints**:
```
GET    /api/cart                          → Get current cart
GET    /api/cart/items                    → Get cart items
POST   /api/cart/items                    → Add product to cart
PUT    /api/cart/items/{cartItemId}       → Update quantity
DELETE /api/cart/items/{cartItemId}       → Remove item
DELETE /api/cart/clear                    → Clear cart

POST   /api/cart/coupon                   → Apply coupon
DELETE /api/cart/coupon                   → Remove coupon
POST   /api/cart/discount/{discountId}    → Apply discount
DELETE /api/cart/discount                 → Remove discount

POST   /api/cart/checkout                 → Checkout (DRAFT → PENDING)

GET    /api/cart/orders                   → Get user orders
GET    /api/cart/orders/{orderId}         → Get order by ID
POST   /api/cart/orders/{orderId}/cancel-item  → Cancel order item
POST   /api/cart/orders/{orderId}/cancel  → Cancel entire order
GET    /api/cart/orders/{orderId}/refund-summary → Get refund summary
```

**⚠️ ISSUES**:

1. **Authentication Disabled**:
```java
// @PreAuthorize("hasRole('CLIENT')") // ✅ TEMPORARILY REMOVED
private ObjectId getUserId(Authentication authentication) {
    User testClient = userRepository.findByEmail("client@test.com").orElse(null);
    return testClient.getId(); // ⚠️ Hardcoded test user
}
```

2. **Cart vs Orders Confusion**:
- `/api/cart/orders` returns Carts with non-DRAFT status
- No clear separation between cart operations and order operations

---

## 6. REPOSITORY LAYER ANALYSIS

### 6.1 CartRepository
**File**: `backend/src/main/java/esprit_market/repository/cartRepository/CartRepository.java`

**Methods**:
```java
Optional<Cart> findByUserAndStatus(User user, CartStatus status);
List<Cart> findAllByUserAndStatus(User user, CartStatus status);  // ✅ Fix for multiple DRAFT carts
List<Cart> findByUser(User user);
List<Cart> findByStatus(CartStatus status);
List<Cart> findByStatusAndLastUpdatedBefore(CartStatus status, LocalDateTime date);
boolean existsByUserAndStatus(User user, CartStatus status);
List<Cart> findByStatusIn(List<CartStatus> statuses);
```

**⚠️ ISSUE**: `findByUserAndStatus` can fail if multiple DRAFT carts exist

### 6.2 CartItemRepository
**File**: `backend/src/main/java/esprit_market/repository/cartRepository/CartItemRepository.java`

**Methods**:
```java
List<CartItem> findByCartId(ObjectId cartId);
Optional<CartItem> findByCartIdAndProductId(ObjectId cartId, ObjectId productId);
void deleteByCartId(ObjectId cartId);
long countByCartId(ObjectId cartId);
```

**✅ GOOD**: Simple and focused

### 6.3 CouponRepository
**File**: `backend/src/main/java/esprit_market/repository/cartRepository/CouponRepository.java`

**Methods**:
```java
Optional<Coupons> findByCode(String code);
boolean existsByCode(String code);
List<Coupons> findByUserId(ObjectId userId);
List<Coupons> findByActiveTrue();
List<Coupons> findByActiveTrueAndExpirationDateAfter(LocalDate date);
List<Coupons> findByEligibleUserLevel(String level);
```

**✅ GOOD**: Comprehensive query methods

---

## 7. IDENTIFIED PROBLEMS

### 7.1 CRITICAL ISSUES (Must Fix)

#### ❌ **ISSUE #1: Cart Entity Used as Order**
**Problem**: Single `Cart` entity serves dual purpose:
- Shopping cart (status = DRAFT)
- Order (status = PENDING, CONFIRMED, PAID, etc.)

**Impact**:
- Confusing semantics (is it a cart or an order?)
- Mixed responsibilities in service layer
- API endpoints unclear (`/api/cart/orders` returns Carts)

**Minimal Fix**:
- Keep Cart entity as-is (don't break integration)
- Add clear documentation/comments
- Rename methods for clarity (e.g., `getUserOrders` instead of `getUserCarts`)

#### ❌ **ISSUE #2: Stock Reduced at PENDING, Not CONFIRMED**
**Problem**: In `checkout()` method:
```java
cart.setStatus(CartStatus.PENDING);
productService.reduceStock(item.getProductId(), item.getQuantity());
```
Stock is reduced when order is PENDING (not yet paid), not when CONFIRMED/PAID.

**Impact**:
- If user abandons payment, stock remains reduced
- Inventory inaccuracy
- Potential overselling or underselling

**Minimal Fix**:
- Move stock reduction to payment confirmation step
- Add stock reservation mechanism for PENDING orders
- Add scheduled job to release reserved stock after timeout

#### ❌ **ISSUE #3: Multiple DRAFT Carts Possible**
**Problem**: Repository method `findByUserAndStatus` expects unique result, but multiple DRAFT carts can exist.

**Impact**:
- Query fails with "non unique result" exception
- User cannot add items to cart

**Minimal Fix**:
- Use `findAllByUserAndStatus` and take first result
- Add unique constraint or cleanup job to remove duplicate DRAFT carts

#### ❌ **ISSUE #4: Weak References (No @DBRef)**
**Problem**: CartItem uses `ObjectId cartId` instead of `@DBRef Cart cart`

**Impact**:
- No automatic cascade delete
- Manual cleanup required when cart is deleted
- Orphaned cart items possible

**Minimal Fix**:
- Add manual cascade delete in service layer
- Add cleanup job to remove orphaned cart items

### 7.2 MODERATE ISSUES (Should Fix)

#### ⚠️ **ISSUE #5: Coupon/Discount Combination Logic Scattered**
**Problem**: Combination validation is split between:
- `CouponsServiceImpl.canCombineWithDiscount()`
- `CartServiceImpl.applyCoupon()`
- `CartServiceImpl.applyDiscount()`

**Impact**:
- Hard to maintain
- Potential inconsistencies

**Minimal Fix**:
- Centralize combination logic in a single method
- Add unit tests for all combination scenarios

#### ⚠️ **ISSUE #6: Denormalized Data in CartItem**
**Problem**: `productName` and `productPrice` are copied from Product entity

**Impact**:
- If product price changes, old orders show old price (this might be intentional)
- If product is deleted, order still shows product name (good for history)

**Decision**: This is actually GOOD for order history. Mark as "intentional denormalization".

#### ⚠️ **ISSUE #7: Loyalty Points Timing Unclear**
**Problem**: `addPointsForCart()` method exists but unclear when it's called

**Impact**:
- Points might be added before payment confirmation
- Points might not be added at all

**Minimal Fix**:
- Call `addPointsForCart()` after order status changes to CONFIRMED/PAID
- Add explicit call in payment confirmation flow

### 7.3 MINOR ISSUES (Nice to Have)

#### ℹ️ **ISSUE #8: No Order Number**
**Problem**: Orders are identified by MongoDB ObjectId, not human-readable order number

**Impact**:
- Hard for users to reference orders
- Hard for customer support

**Future Enhancement**: Add `orderNumber` field (e.g., "ORD-2026-0001")

#### ℹ️ **ISSUE #9: No Payment Status Tracking**
**Problem**: Cart has `paymentMethod` but no `paymentStatus` or `paymentId`

**Impact**:
- Cannot track payment failures
- Cannot handle refunds properly

**Future Enhancement**: Add Payment entity or payment tracking fields

#### ℹ️ **ISSUE #10: No Audit Trail**
**Problem**: No history of status changes, price changes, or modifications

**Impact**:
- Cannot track who changed what and when
- Hard to debug issues

**Future Enhancement**: Add OrderHistory or AuditLog entity

---

## 8. MINIMAL FIX RECOMMENDATIONS

### 8.1 IMMEDIATE FIXES (Do Now)

#### Fix #1: Use findAllByUserAndStatus for DRAFT Cart
**File**: `CartServiceImpl.java`
**Change**:
```java
// OLD:
Optional<Cart> findByUserAndStatus(user, CartStatus.DRAFT);

// NEW:
List<Cart> drafts = cartRepository.findAllByUserAndStatus(user, CartStatus.DRAFT);
Cart cart = drafts.isEmpty() ? createNewCart(user) : drafts.get(0);

// Cleanup duplicates if found
if (drafts.size() > 1) {
    for (int i = 1; i < drafts.size(); i++) {
        cartRepository.delete(drafts.get(i));
    }
}
```

#### Fix #2: Move Stock Reduction to Payment Confirmation
**File**: `CartServiceImpl.java`
**Change**:
```java
// In checkout() method:
// OLD:
cart.setStatus(CartStatus.PENDING);
productService.reduceStock(item.getProductId(), item.getQuantity());

// NEW:
cart.setStatus(CartStatus.PENDING);
// Stock reduction moved to confirmPayment() method

// Add new method:
@Transactional
public CartResponse confirmPayment(ObjectId userId, ObjectId orderId, String paymentId) {
    Cart order = getOrderById(userId, orderId);
    
    if (order.getStatus() != CartStatus.PENDING) {
        throw new IllegalStateException("Order is not in PENDING status");
    }
    
    // Reduce stock only after payment confirmed
    List<CartItem> items = cartItemRepository.findByCartId(orderId);
    for (CartItem item : items) {
        productService.reduceStock(item.getProductId(), item.getQuantity());
    }
    
    order.setStatus(CartStatus.CONFIRMED);
    order.setPaymentMethod(paymentId);
    Cart updated = cartRepository.save(order);
    
    // Add loyalty points after payment confirmed
    loyaltyCardService.addPointsForCart(userId, order.getFinalAmount());
    
    return cartMapper.toResponse(updated);
}
```

#### Fix #3: Add Manual Cascade Delete for CartItems
**File**: `CartServiceImpl.java`
**Change**:
```java
// Add method to delete cart with items:
@Transactional
public void deleteCartWithItems(ObjectId cartId) {
    cartItemRepository.deleteByCartId(cartId);
    cartRepository.deleteById(cartId);
}
```

#### Fix #4: Add Cleanup Job for Orphaned CartItems
**File**: Create new `CartCleanupScheduler.java`
```java
@Component
@RequiredArgsConstructor
public class CartCleanupScheduler {
    private final CartItemRepository cartItemRepository;
    private final CartRepository cartRepository;
    
    @Scheduled(cron = "0 0 2 * * ?") // Run at 2 AM daily
    public void cleanupOrphanedCartItems() {
        List<CartItem> allItems = cartItemRepository.findAll();
        for (CartItem item : allItems) {
            if (!cartRepository.existsById(item.getCartId())) {
                cartItemRepository.delete(item);
            }
        }
    }
    
    @Scheduled(cron = "0 0 3 * * ?") // Run at 3 AM daily
    public void cleanupAbandonedCarts() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        List<Cart> abandoned = cartRepository.findByStatusAndLastUpdatedBefore(
            CartStatus.DRAFT, threshold
        );
        for (Cart cart : abandoned) {
            cartItemRepository.deleteByCartId(cart.getId());
            cartRepository.delete(cart);
        }
    }
}
```

### 8.2 SHORT-TERM FIXES (Do Soon)

#### Fix #5: Centralize Coupon/Discount Combination Logic
**File**: `CartServiceImpl.java`
**Add method**:
```java
private void validateCouponDiscountCombination(Cart cart, String couponCode, ObjectId discountId) {
    boolean hasCoupon = cart.getCouponCode() != null;
    boolean hasDiscount = cart.getDiscountId() != null;
    boolean addingCoupon = couponCode != null;
    boolean addingDiscount = discountId != null;
    
    if (addingCoupon && hasDiscount) {
        if (!couponService.canCombineWithDiscount(couponCode)) {
            throw new IllegalStateException(
                "Coupon '" + couponCode + "' cannot be combined with existing discount"
            );
        }
    }
    
    if (addingDiscount && hasCoupon) {
        if (!couponService.canCombineWithDiscount(cart.getCouponCode())) {
            throw new IllegalStateException(
                "Existing coupon cannot be combined with discount"
            );
        }
    }
}
```

#### Fix #6: Add Loyalty Points After Payment Confirmation
**File**: `CartServiceImpl.java`
**Change**: Call `loyaltyCardService.addPointsForCart()` in `confirmPayment()` method (see Fix #2)

#### Fix #7: Add Clear Documentation
**File**: `Cart.java`
**Add JavaDoc**:
```java
/**
 * Cart entity serves dual purpose:
 * 1. Shopping Cart (status = DRAFT): Active cart for adding/removing items
 * 2. Order (status = PENDING/CONFIRMED/PAID/etc.): Completed orders
 * 
 * Lifecycle:
 * - DRAFT: User is shopping, can modify items
 * - PENDING: Order placed, waiting for payment confirmation
 * - CONFIRMED/PAID: Payment confirmed, stock reduced, order processing
 * - PROCESSING: Order being prepared
 * - SHIPPED: Order shipped to customer
 * - DELIVERED: Order delivered successfully
 * - CANCELLED/REFUNDED: Order cancelled, stock restored
 * 
 * Note: This design choice was made to avoid creating a separate Order entity
 * and breaking integration with other modules.
 */
@Document(collection = "carts")
public class Cart {
    // ...
}
```

### 8.3 FUTURE ENHANCEMENTS (Optional)

#### Enhancement #1: Add Order Number
**File**: `Cart.java`
**Add field**:
```java
@Indexed(unique = true, sparse = true)
private String orderNumber; // e.g., "ORD-2026-0001"
```

#### Enhancement #2: Add Payment Tracking
**File**: `Cart.java`
**Add fields**:
```java
private String paymentStatus; // PENDING, COMPLETED, FAILED, REFUNDED
private String paymentId; // External payment gateway ID
private String paymentGateway; // STRIPE, PAYPAL, etc.
private LocalDateTime paymentDate;
```

#### Enhancement #3: Add Audit Trail
**File**: Create new `OrderHistory.java`
```java
@Document(collection = "order_history")
public class OrderHistory {
    @Id private ObjectId id;
    private ObjectId orderId;
    private CartStatus oldStatus;
    private CartStatus newStatus;
    private String changedBy;
    private LocalDateTime changedAt;
    private String reason;
}
```

---

## 9. TESTING RECOMMENDATIONS

### 9.1 Unit Tests Needed

1. **CartServiceImpl**:
   - Test multiple DRAFT carts handling
   - Test stock reduction timing
   - Test coupon/discount combination rules
   - Test order cancellation and refund logic

2. **CouponsServiceImpl**:
   - Test user level eligibility
   - Test usage limit enforcement
   - Test expiration date validation
   - Test combination rules

3. **LoyaltyCardServiceImpl**:
   - Test points calculation with multipliers
   - Test level upgrade logic
   - Test points to discount conversion

### 9.2 Integration Tests Needed

1. **Checkout Flow**:
   - Add items → Apply coupon → Apply discount → Checkout → Confirm payment
   - Verify stock reduction happens at correct step
   - Verify loyalty points added after payment

2. **Cancellation Flow**:
   - Place order → Cancel item → Verify stock restored
   - Place order → Cancel order → Verify full refund

3. **Coupon/Discount Combination**:
   - Test all combination scenarios
   - Test user level restrictions

---

## 10. SUMMARY

### Current State:
- ✅ Functional cart and order management
- ✅ Comprehensive coupon and discount system
- ✅ Loyalty points with level-based multipliers
- ⚠️ Cart entity serves dual purpose (cart + order)
- ⚠️ Stock reduced at wrong time (PENDING instead of CONFIRMED)
- ⚠️ Weak references cause potential orphaned data
- ⚠️ Multiple DRAFT carts can cause errors

### Recommended Actions:
1. **IMMEDIATE**: Fix multiple DRAFT carts issue
2. **IMMEDIATE**: Move stock reduction to payment confirmation
3. **IMMEDIATE**: Add manual cascade delete for cart items
4. **SHORT-TERM**: Add cleanup jobs for orphaned data
5. **SHORT-TERM**: Centralize coupon/discount combination logic
6. **SHORT-TERM**: Add clear documentation
7. **FUTURE**: Consider adding Order entity (major refactor)
8. **FUTURE**: Add payment tracking and audit trail

### Integration Safety:
- ✅ All fixes are backward compatible
- ✅ No entity structure changes required
- ✅ No breaking API changes
- ✅ Other modules not affected

---

**END OF ANALYSIS**
