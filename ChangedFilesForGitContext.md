# Changed Files for Git Context

This file tracks all modifications made during the Order Module architecture review.

---

## Review Session: 2026-02-28

### Files Created

| File Path | File Name | Type | Description | Date |
|-----------|-----------|------|-------------|------|
| src/main/java/esprit_market/dto/CouponCreateRequest.java | CouponCreateRequest.java | Created | Request DTO for creating coupons | 2026-02-28 |
| src/main/java/esprit_market/dto/CouponUpdateRequest.java | CouponUpdateRequest.java | Created | Request DTO for updating coupons | 2026-02-28 |
| src/main/java/esprit_market/dto/CouponResponse.java | CouponResponse.java | Created | Response DTO with computed fields | 2026-02-28 |
| src/main/java/esprit_market/dto/DiscountCreateRequest.java | DiscountCreateRequest.java | Created | Request DTO for creating discounts | 2026-02-28 |
| src/main/java/esprit_market/dto/DiscountUpdateRequest.java | DiscountUpdateRequest.java | Created | Request DTO for updating discounts | 2026-02-28 |
| src/main/java/esprit_market/dto/DiscountResponse.java | DiscountResponse.java | Created | Response DTO with computed fields | 2026-02-28 |
| src/main/java/esprit_market/dto/LoyaltyCardResponse.java | LoyaltyCardResponse.java | Created | Response DTO with computed fields | 2026-02-28 |
| src/main/java/esprit_market/dto/CartResponse.java | CartResponse.java | Created | Response DTO with computed fields | 2026-02-28 |
| src/main/java/esprit_market/dto/CartItemResponse.java | CartItemResponse.java | Created | Response DTO with computed fields | 2026-02-28 |
| src/main/java/esprit_market/dto/AddToCartRequest.java | AddToCartRequest.java | Created | Standalone request DTO for adding to cart | 2026-02-28 |
| ChangedFilesForGitContext.md | ChangedFilesForGitContext.md | Created | Git tracking file | 2026-02-28 |

### Files Modified

| File Path | File Name | Type | Description | Date |
|-----------|-----------|------|-------------|------|
| src/main/java/esprit_market/mappers/CouponMapper.java | CouponMapper.java | Modified | Uses only Request/Response DTOs | 2026-02-28 |
| src/main/java/esprit_market/mappers/DiscountMapper.java | DiscountMapper.java | Modified | Uses only Request/Response DTOs | 2026-02-28 |
| src/main/java/esprit_market/mappers/LoyaltyCardMapper.java | LoyaltyCardMapper.java | Modified | Uses only Response DTO | 2026-02-28 |
| src/main/java/esprit_market/mappers/CartMapper.java | CartMapper.java | Modified | Uses only Response DTO | 2026-02-28 |
| src/main/java/esprit_market/mappers/CartItemMapper.java | CartItemMapper.java | Modified | Uses only Response DTO | 2026-02-28 |
| src/main/java/esprit_market/service/cartService/ICouponsService.java | ICouponsService.java | Modified | Uses Request/Response DTOs | 2026-02-28 |
| src/main/java/esprit_market/service/cartService/IDiscountService.java | IDiscountService.java | Modified | Uses Request/Response DTOs | 2026-02-28 |
| src/main/java/esprit_market/service/cartService/ILoyaltyCardService.java | ILoyaltyCardService.java | Modified | Uses Response DTO | 2026-02-28 |
| src/main/java/esprit_market/service/cartService/ICartService.java | ICartService.java | Modified | Uses Response DTOs | 2026-02-28 |
| src/main/java/esprit_market/service/cartService/ICartItemService.java | ICartItemService.java | Modified | Uses Response DTO | 2026-02-28 |
| src/main/java/esprit_market/service/cartService/CouponsServiceImpl.java | CouponsServiceImpl.java | Modified | Removed legacy methods | 2026-02-28 |
| src/main/java/esprit_market/service/cartService/DiscountServiceImpl.java | DiscountServiceImpl.java | Modified | Removed legacy methods | 2026-02-28 |
| src/main/java/esprit_market/service/cartService/LoyaltyCardServiceImpl.java | LoyaltyCardServiceImpl.java | Modified | Removed legacy methods | 2026-02-28 |
| src/main/java/esprit_market/service/cartService/CartServiceImpl.java | CartServiceImpl.java | Modified | Uses Response DTOs | 2026-02-28 |
| src/main/java/esprit_market/service/cartService/CartItemServiceImpl.java | CartItemServiceImpl.java | Modified | Uses Response DTO | 2026-02-28 |
| src/main/java/esprit_market/controller/cartController/CouponController.java | CouponController.java | Modified | Uses Request/Response DTOs | 2026-02-28 |
| src/main/java/esprit_market/controller/cartController/DiscountController.java | DiscountController.java | Modified | Uses Request/Response DTOs | 2026-02-28 |
| src/main/java/esprit_market/controller/cartController/LoyaltyCardController.java | LoyaltyCardController.java | Modified | Uses Response DTO | 2026-02-28 |
| src/main/java/esprit_market/controller/cartController/CartController.java | CartController.java | Modified | Uses Response DTOs | 2026-02-28 |
| src/main/java/esprit_market/controller/cartController/CartItemController.java | CartItemController.java | Modified | Uses Response DTO | 2026-02-28 |
| src/main/java/esprit_market/dto/CancelOrderRequest.java | CancelOrderRequest.java | Modified | Removed nested AddToCartRequest class | 2026-02-28 |

### Files Deleted (Content Replaced with Deprecation Notice)

| File Path | File Name | Type | Description | Date |
|-----------|-----------|------|-------------|------|
| src/main/java/esprit_market/dto/CartDTO.java | CartDTO.java | Deleted | Replaced by CartResponse - DELETE THIS FILE | 2026-02-28 |
| src/main/java/esprit_market/dto/CartItemDTO.java | CartItemDTO.java | Deleted | Replaced by CartItemResponse - DELETE THIS FILE | 2026-02-28 |
| src/main/java/esprit_market/dto/CouponDTO.java | CouponDTO.java | Deleted | Replaced by CouponResponse - DELETE THIS FILE | 2026-02-28 |
| src/main/java/esprit_market/dto/DiscountDTO.java | DiscountDTO.java | Deleted | Replaced by DiscountResponse - DELETE THIS FILE | 2026-02-28 |
| src/main/java/esprit_market/dto/LoyaltyCardDTO.java | LoyaltyCardDTO.java | Deleted | Replaced by LoyaltyCardResponse - DELETE THIS FILE | 2026-02-28 |

---

## Summary

### New DTO Structure:

```
Coupon:
├── CouponCreateRequest (input)
├── CouponUpdateRequest (input)
└── CouponResponse (output)

Discount:
├── DiscountCreateRequest (input)
├── DiscountUpdateRequest (input)
└── DiscountResponse (output)

Cart:
├── AddToCartRequest (input)
├── UpdateCartItemRequest (input)
├── ApplyCouponRequest (input)
├── CheckoutRequest (input)
├── CancelOrderRequest (input)
├── CancelOrderItemRequest (input)
├── CartResponse (output)
└── CartItemResponse (output)

LoyaltyCard:
├── ConvertPointsRequest (input)
└── LoyaltyCardResponse (output)

RefundSummaryDTO (output - kept as is)
```

### DTOs to Delete:
Run these commands to delete unused DTOs:
```
del src\main\java\esprit_market\dto\CartDTO.java
del src\main\java\esprit_market\dto\CartItemDTO.java
del src\main\java\esprit_market\dto\CouponDTO.java
del src\main\java\esprit_market\dto\DiscountDTO.java
del src\main\java\esprit_market\dto\LoyaltyCardDTO.java
```

---

## Unit Testing Session: 2026-02-28

### Test Files Created

| File Path | File Name | Type | Description | Date |
|-----------|-----------|------|-------------|------|
| src/test/java/esprit_market/CartServiceImplTest.java | CartServiceImplTest.java | Created | Unit tests for CartServiceImpl - cart management, price calculation, checkout, cancellation | 2026-02-28 |
| src/test/java/esprit_market/LoyaltyCardServiceImplTest.java | LoyaltyCardServiceImplTest.java | Created | Unit tests for LoyaltyCardServiceImpl - points earning, level calculation, multipliers | 2026-02-28 |
| src/test/java/esprit_market/DiscountServiceImplTest.java | DiscountServiceImplTest.java | Created | Unit tests for DiscountServiceImpl - discount CRUD operations, validation | 2026-02-28 |
| src/test/java/esprit_market/CouponsServiceImplTest.java | CouponsServiceImplTest.java | Created | Unit tests for CouponsServiceImpl - coupon validation, user level eligibility, usage management | 2026-02-28 |
| src/test/java/esprit_market/CartEnumTest.java | CartEnumTest.java | Created | Unit tests for CartStatus, CartItemStatus, DiscountType enums - state transitions | 2026-02-28 |

---

## WHAT WAS CREATED AND WHY

### What is a Unit Test?
A **unit test** is a type of software test that verifies the behavior of a small, isolated piece of code (a "unit"), typically a single method or function. Unit tests:
- Run in isolation from external dependencies (database, network, file system)
- Are fast to execute
- Provide immediate feedback on code correctness
- Document expected behavior

### What is Mocked?
In these tests, the following components are **mocked** using Mockito:
- **Repositories** (CartRepository, CartItemRepository, ProductRepository, CouponRepository, DiscountRepository, UserRepository, LoyaltyCardRepository) - to avoid actual database operations
- **Mappers** (CartMapper, CartItemMapper, DiscountMapper, LoyaltyCardMapper) - to control DTO conversion behavior
- **LoyaltyCardServiceImpl** - when used as a dependency in CartServiceImpl

### What Each Test Class Verifies:

#### 1. CartServiceImplTest.java (56+ tests)
- **Cart Management**: getOrCreateCart, addProductToCart, updateCartItemQuantity, removeCartItem, clearCart
- **Coupon Logic**: applyCoupon validation (expiration, usage limit, min cart amount, user level eligibility, combinability)
- **Discount Logic**: applyDiscount, removeDiscount
- **Checkout Process**: DRAFT → CONFIRMED transition, stock deduction, loyalty points, coupon usage increment
- **Order Cancellation**: cancelOrder, cancelOrderItem, partial cancellation, refund calculations
- **Price Calculation**: subtotal, tax (18%), percentage/fixed discounts, total calculation
- **Edge Cases**: invalid inputs, null values, insufficient stock, wrong user

#### 2. LoyaltyCardServiceImplTest.java (40+ tests)
- **Points Earning**: addPointsForCart with level multipliers (BRONZE 1x, SILVER 1.5x, GOLD 2x, PLATINUM 3x)
- **Level Calculation**: BRONZE (0-999), SILVER (1000-4999), GOLD (5000-9999), PLATINUM (10000+)
- **Points Conversion**: 100 points = 1 currency unit, validation for multiples
- **Points Deduction**: deductPoints for refunds, partial deduction when insufficient
- **Edge Cases**: null/zero/negative values, missing loyalty card

#### 3. DiscountServiceImplTest.java (25+ tests)
- **CRUD Operations**: create, read, update, delete discounts
- **Validation**: date range validation (end > start)
- **Active Discounts**: findActiveDiscounts within date range
- **Expiration**: deactivateExpiredDiscounts scheduled task
- **Discount Types**: PERCENTAGE and FIXED type behavior

#### 4. CartEnumTest.java (30+ tests)
- **CartStatus**: DRAFT (Cart), CONFIRMED (Order), state transitions
- **CartItemStatus**: ACTIVE, CANCELLED, PARTIALLY_CANCELLED, REFUNDED
- **DiscountType**: PERCENTAGE and FIXED calculation logic
- **State Transitions**: valid/invalid transitions, terminal states

### How to Run Tests

Using Maven (recommended):
```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=CartServiceImplTest

# Run tests with verbose output
mvn test -Dtest=CartServiceImplTest -X

# Run tests and generate report
mvn test surefire-report:report
```

Using IDE:
- **IntelliJ IDEA**: Right-click on test class → Run
- **Eclipse**: Right-click on test class → Run As → JUnit Test

### Why This Improves Code Safety

1. **Regression Prevention**: Tests catch bugs when code is modified
2. **Documentation**: Tests serve as executable documentation of expected behavior
3. **Refactoring Confidence**: Safely refactor code knowing tests will catch errors
4. **Faster Debugging**: Failed tests pinpoint exact location of problems
5. **Code Coverage**: Ensures critical business logic is tested
6. **CI/CD Integration**: Automated testing in deployment pipelines

### Test Coverage Summary

| Component | Test Count | Coverage Areas |
|-----------|------------|----------------|
| CartServiceImpl | 56+ | Cart CRUD, Checkout, Cancellation, Pricing |
| LoyaltyCardServiceImpl | 40+ | Points, Levels, Multipliers, Conversion |
| DiscountServiceImpl | 25+ | CRUD, Validation, Expiration |
| CouponsServiceImpl | 50+ | Validation, User Level, Usage Management |
| Enums | 30+ | State Values, Transitions, Calculations |
| **TOTAL** | **200+** | Service Layer Business Logic |

---
