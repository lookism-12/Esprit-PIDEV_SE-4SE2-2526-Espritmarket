package esprit_market.cartTest;

import esprit_market.Enum.cartEnum.CartItemStatus;
import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.dto.*;
import esprit_market.entity.cart.*;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.user.User;
import esprit_market.mappers.CartItemMapper;
import esprit_market.mappers.CartMapper;
import esprit_market.repository.cartRepository.*;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.*;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CartServiceImpl.
 * Tests business logic for cart management, price calculation, discounts, coupons, and checkout.
 * 
 * DRAFT status = Cart (shopping phase)
 * CONFIRMED status = Order (checkout complete)
 */
@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private DiscountRepository discountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CartMapper cartMapper;

    @Mock
    private CartItemMapper cartItemMapper;

    @Mock
    private LoyaltyCardServiceImpl loyaltyCardService;

    @InjectMocks
    private CartServiceImpl cartService;

    // Test data
    private ObjectId userId;
    private ObjectId cartId;
    private ObjectId productId;
    private ObjectId cartItemId;
    private Cart testCart;
    private CartItem testCartItem;
    private Product testProduct;
    private User testUser;

    @BeforeEach
    void setUp() {
        userId = new ObjectId();
        cartId = new ObjectId();
        productId = new ObjectId();
        cartItemId = new ObjectId();

        testUser = new User();
        testUser.setId(userId);

        testCart = Cart.builder()
                .id(cartId)
                .userId(userId)
                .status(CartStatus.DRAFT)
                .subtotal(0.0)
                .discountAmount(0.0)
                .taxAmount(0.0)
                .total(0.0)
                .cartItemIds(new ArrayList<>())
                .creationDate(LocalDateTime.now())
                .lastUpdated(LocalDateTime.now())
                .build();

        testProduct = Product.builder()
                .id(productId)
                .name("Test Product")
                .price(100.0)
                .stock(10)
                .build();

        testCartItem = CartItem.builder()
                .id(cartItemId)
                .cartId(cartId)
                .productId(productId)
                .productName("Test Product")
                .quantity(2)
                .unitPrice(100.0)
                .subTotal(200.0)
                .discountApplied(0.0)
                .status(CartItemStatus.ACTIVE)
                .build();
    }

    // ==================== GET OR CREATE CART TESTS ====================

    @Nested
    @DisplayName("getOrCreateCart Tests - DRAFT status = Cart")
    class GetOrCreateCartTests {

        @Test
        @DisplayName("Should return existing draft cart for user")
        void getOrCreateCart_ExistingCart_ReturnsCart() {
            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartMapper.toResponse(testCart)).thenReturn(createCartResponse(testCart));

            CartResponse result = cartService.getOrCreateCart(userId);

            assertNotNull(result);
            assertEquals(cartId.toHexString(), result.getId());
            verify(cartRepository).findByUserIdAndStatus(userId, CartStatus.DRAFT);
            verify(cartRepository, never()).save(any(Cart.class));
        }

        @Test
        @DisplayName("Should create new cart when no draft exists")
        void getOrCreateCart_NoExistingCart_CreatesNewCart() {
            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.empty());
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
            when(cartMapper.toResponse(any(Cart.class))).thenReturn(createCartResponse(testCart));

            CartResponse result = cartService.getOrCreateCart(userId);

            assertNotNull(result);
            verify(cartRepository).save(any(Cart.class));
            verify(userRepository).save(any(User.class));
        }
    }

    // ==================== ADD PRODUCT TO CART TESTS ====================

    @Nested
    @DisplayName("addProductToCart Tests")
    class AddProductToCartTests {

        @Test
        @DisplayName("Should add new product to cart successfully")
        void addProductToCart_NewProduct_Success() {
            AddToCartRequest request = AddToCartRequest.builder()
                    .productId(productId.toHexString())
                    .quantity(2)
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(cartItemRepository.findByCartIdAndProductId(cartId, productId))
                    .thenReturn(Optional.empty());
            when(cartItemRepository.save(any(CartItem.class))).thenReturn(testCartItem);
            when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
            when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(cartItemMapper.toResponse(any(CartItem.class))).thenReturn(createCartItemResponse(testCartItem));

            CartItemResponse result = cartService.addProductToCart(userId, request);

            assertNotNull(result);
            verify(cartItemRepository).save(any(CartItem.class));
        }

        @Test
        @DisplayName("Should update quantity when product already in cart")
        void addProductToCart_ExistingProduct_UpdatesQuantity() {
            AddToCartRequest request = AddToCartRequest.builder()
                    .productId(productId.toHexString())
                    .quantity(3)
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(cartItemRepository.findByCartIdAndProductId(cartId, productId))
                    .thenReturn(Optional.of(testCartItem));
            when(cartItemRepository.save(any(CartItem.class))).thenReturn(testCartItem);
            when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(cartItemMapper.toResponse(any(CartItem.class))).thenReturn(createCartItemResponse(testCartItem));

            CartItemResponse result = cartService.addProductToCart(userId, request);

            assertNotNull(result);
            verify(cartItemRepository).save(any(CartItem.class));
        }

        @Test
        @DisplayName("Should throw exception for invalid quantity (zero)")
        void addProductToCart_ZeroQuantity_ThrowsException() {
            AddToCartRequest request = AddToCartRequest.builder()
                    .productId(productId.toHexString())
                    .quantity(0)
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.addProductToCart(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for negative quantity")
        void addProductToCart_NegativeQuantity_ThrowsException() {
            AddToCartRequest request = AddToCartRequest.builder()
                    .productId(productId.toHexString())
                    .quantity(-1)
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.addProductToCart(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for null quantity")
        void addProductToCart_NullQuantity_ThrowsException() {
            AddToCartRequest request = AddToCartRequest.builder()
                    .productId(productId.toHexString())
                    .quantity(null)
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.addProductToCart(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for invalid product ID format")
        void addProductToCart_InvalidProductId_ThrowsException() {
            AddToCartRequest request = AddToCartRequest.builder()
                    .productId("invalid-id")
                    .quantity(1)
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.addProductToCart(userId, request));
        }

        @Test
        @DisplayName("Should throw exception when product not found")
        void addProductToCart_ProductNotFound_ThrowsException() {
            AddToCartRequest request = AddToCartRequest.builder()
                    .productId(productId.toHexString())
                    .quantity(1)
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(productRepository.findById(productId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> cartService.addProductToCart(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for insufficient stock")
        void addProductToCart_InsufficientStock_ThrowsException() {
            AddToCartRequest request = AddToCartRequest.builder()
                    .productId(productId.toHexString())
                    .quantity(100)
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));

            assertThrows(InsufficientStockException.class,
                    () -> cartService.addProductToCart(userId, request));
        }
    }

    // ==================== UPDATE CART ITEM QUANTITY TESTS ====================

    @Nested
    @DisplayName("updateCartItemQuantity Tests")
    class UpdateCartItemQuantityTests {

        @Test
        @DisplayName("Should update cart item quantity successfully")
        void updateCartItemQuantity_ValidQuantity_Success() {
            UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                    .quantity(5)
                    .build();

            testCart.getCartItemIds().add(cartItemId);
            testCartItem.setCartId(cartId);

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(testCartItem));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(cartItemRepository.save(any(CartItem.class))).thenReturn(testCartItem);
            when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
            when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(cartItemMapper.toResponse(any(CartItem.class))).thenReturn(createCartItemResponse(testCartItem));

            CartItemResponse result = cartService.updateCartItemQuantity(userId, cartItemId, request);

            assertNotNull(result);
            verify(cartItemRepository).save(any(CartItem.class));
        }

        @Test
        @DisplayName("Should throw exception for invalid quantity")
        void updateCartItemQuantity_InvalidQuantity_ThrowsException() {
            UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                    .quantity(0)
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.updateCartItemQuantity(userId, cartItemId, request));
        }

        @Test
        @DisplayName("Should throw exception when item doesn't belong to user's cart")
        void updateCartItemQuantity_ItemNotInCart_ThrowsException() {
            UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                    .quantity(5)
                    .build();

            ObjectId differentCartId = new ObjectId();
            testCartItem.setCartId(differentCartId);

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(testCartItem));

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.updateCartItemQuantity(userId, cartItemId, request));
        }

        @Test
        @DisplayName("Should throw exception when cart not found")
        void updateCartItemQuantity_CartNotFound_ThrowsException() {
            UpdateCartItemRequest request = UpdateCartItemRequest.builder()
                    .quantity(5)
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.empty());

            assertThrows(CartNotFoundException.class,
                    () -> cartService.updateCartItemQuantity(userId, cartItemId, request));
        }
    }

    // ==================== REMOVE CART ITEM TESTS ====================

    @Nested
    @DisplayName("removeCartItem Tests")
    class RemoveCartItemTests {

        @Test
        @DisplayName("Should remove cart item successfully")
        void removeCartItem_ValidItem_Success() {
            testCart.getCartItemIds().add(cartItemId);
            testCartItem.setCartId(cartId);

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(testCartItem));
            when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
            when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(Collections.emptyList());

            cartService.removeCartItem(userId, cartItemId);

            verify(cartItemRepository).deleteById(cartItemId);
        }

        @Test
        @DisplayName("Should throw exception when cart not found")
        void removeCartItem_CartNotFound_ThrowsException() {
            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.empty());

            assertThrows(CartNotFoundException.class,
                    () -> cartService.removeCartItem(userId, cartItemId));
        }

        @Test
        @DisplayName("Should throw exception when cart item not found")
        void removeCartItem_ItemNotFound_ThrowsException() {
            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> cartService.removeCartItem(userId, cartItemId));
        }
    }

    // ==================== CLEAR CART TESTS ====================

    @Nested
    @DisplayName("clearCart Tests")
    class ClearCartTests {

        @Test
        @DisplayName("Should clear cart successfully")
        void clearCart_ValidCart_Success() {
            testCart.getCartItemIds().add(cartItemId);

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

            cartService.clearCart(userId);

            verify(cartItemRepository).deleteByCartId(cartId);
            verify(cartRepository).save(any(Cart.class));
        }

        @Test
        @DisplayName("Should throw exception when cart not found")
        void clearCart_CartNotFound_ThrowsException() {
            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.empty());

            assertThrows(CartNotFoundException.class,
                    () -> cartService.clearCart(userId));
        }
    }

    // ==================== APPLY COUPON TESTS ====================

    @Nested
    @DisplayName("applyCoupon Tests")
    class ApplyCouponTests {

        private Coupons validCoupon;

        @BeforeEach
        void setUpCoupon() {
            validCoupon = Coupons.builder()
                    .id(new ObjectId())
                    .code("SAVE10")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(10.0)
                    .active(true)
                    .expirationDate(LocalDate.now().plusDays(30))
                    .usageLimit(100)
                    .usageCount(0)
                    .minCartAmount(50.0)
                    .build();
        }

        @Test
        @DisplayName("Should apply valid coupon successfully")
        void applyCoupon_ValidCoupon_Success() {
            ApplyCouponRequest request = ApplyCouponRequest.builder()
                    .couponCode("SAVE10")
                    .build();

            testCart.setSubtotal(100.0);
            testCartItem.setSubTotal(100.0);

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(validCoupon));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(loyaltyCardService.getOrCreateLoyaltyCardEntity(userId))
                    .thenReturn(LoyaltyCard.builder().level("BRONZE").build());
            when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
            when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));
            when(cartMapper.toResponse(any(Cart.class))).thenReturn(createCartResponse(testCart));

            CartResponse result = cartService.applyCoupon(userId, request);

            assertNotNull(result);
            verify(cartRepository, atLeastOnce()).save(any(Cart.class));
        }

        @Test
        @DisplayName("Should throw exception for inactive coupon")
        void applyCoupon_InactiveCoupon_ThrowsException() {
            validCoupon.setActive(false);
            ApplyCouponRequest request = ApplyCouponRequest.builder()
                    .couponCode("SAVE10")
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(validCoupon));

            assertThrows(CouponNotValidException.class,
                    () -> cartService.applyCoupon(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for expired coupon")
        void applyCoupon_ExpiredCoupon_ThrowsException() {
            validCoupon.setExpirationDate(LocalDate.now().minusDays(1));
            ApplyCouponRequest request = ApplyCouponRequest.builder()
                    .couponCode("SAVE10")
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(validCoupon));

            assertThrows(CouponNotValidException.class,
                    () -> cartService.applyCoupon(userId, request));
        }

        @Test
        @DisplayName("Should throw exception when usage limit reached")
        void applyCoupon_UsageLimitReached_ThrowsException() {
            validCoupon.setUsageLimit(10);
            validCoupon.setUsageCount(10);
            ApplyCouponRequest request = ApplyCouponRequest.builder()
                    .couponCode("SAVE10")
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(validCoupon));

            assertThrows(CouponNotValidException.class,
                    () -> cartService.applyCoupon(userId, request));
        }

        @Test
        @DisplayName("Should throw exception when cart total below minimum")
        void applyCoupon_BelowMinAmount_ThrowsException() {
            validCoupon.setMinCartAmount(200.0);
            testCartItem.setSubTotal(50.0);
            ApplyCouponRequest request = ApplyCouponRequest.builder()
                    .couponCode("SAVE10")
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(validCoupon));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));

            assertThrows(CouponNotValidException.class,
                    () -> cartService.applyCoupon(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for coupon not found")
        void applyCoupon_CouponNotFound_ThrowsException() {
            ApplyCouponRequest request = ApplyCouponRequest.builder()
                    .couponCode("INVALID")
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(couponRepository.findByCode("INVALID")).thenReturn(Optional.empty());

            assertThrows(CouponNotValidException.class,
                    () -> cartService.applyCoupon(userId, request));
        }

        @Test
        @DisplayName("Should throw exception when user level not eligible")
        void applyCoupon_UserLevelNotEligible_ThrowsException() {
            validCoupon.setEligibleUserLevel("GOLD");
            testCartItem.setSubTotal(100.0);
            ApplyCouponRequest request = ApplyCouponRequest.builder()
                    .couponCode("SAVE10")
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(validCoupon));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(loyaltyCardService.getOrCreateLoyaltyCardEntity(userId))
                    .thenReturn(LoyaltyCard.builder().level("BRONZE").build());

            assertThrows(CouponNotValidException.class,
                    () -> cartService.applyCoupon(userId, request));
        }

        @Test
        @DisplayName("Should throw exception when coupon not combinable with discount")
        void applyCoupon_NotCombinable_ThrowsException() {
            validCoupon.setCombinableWithDiscount(false);
            testCart.setAppliedDiscountId(new ObjectId());
            testCartItem.setSubTotal(100.0);
            ApplyCouponRequest request = ApplyCouponRequest.builder()
                    .couponCode("SAVE10")
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(validCoupon));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(loyaltyCardService.getOrCreateLoyaltyCardEntity(userId))
                    .thenReturn(LoyaltyCard.builder().level("BRONZE").build());

            assertThrows(CouponNotValidException.class,
                    () -> cartService.applyCoupon(userId, request));
        }
    }

    // ==================== APPLY DISCOUNT TESTS ====================

    @Nested
    @DisplayName("applyDiscount Tests")
    class ApplyDiscountTests {

        @Test
        @DisplayName("Should apply discount successfully")
        void applyDiscount_ValidDiscount_Success() {
            ObjectId discountId = new ObjectId();
            Discount discount = Discount.builder()
                    .id(discountId)
                    .name("Summer Sale")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(15.0)
                    .active(true)
                    .build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(discountRepository.findById(discountId)).thenReturn(Optional.of(discount));
            when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
            when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(cartMapper.toResponse(any(Cart.class))).thenReturn(createCartResponse(testCart));

            CartResponse result = cartService.applyDiscount(userId, discountId);

            assertNotNull(result);
            verify(cartRepository, atLeastOnce()).save(any(Cart.class));
        }

        @Test
        @DisplayName("Should throw exception when discount not found")
        void applyDiscount_NotFound_ThrowsException() {
            ObjectId discountId = new ObjectId();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(discountRepository.findById(discountId)).thenReturn(Optional.empty());

            assertThrows(DiscountNotValidException.class,
                    () -> cartService.applyDiscount(userId, discountId));
        }
    }

    // ==================== CHECKOUT TESTS ====================

    @Nested
    @DisplayName("checkout Tests - DRAFT to CONFIRMED transition")
    class CheckoutTests {

        @Test
        @DisplayName("Should checkout successfully with valid cart")
        void checkout_ValidCart_Success() {
            CheckoutRequest request = CheckoutRequest.builder()
                    .shippingAddress("123 Test St")
                    .billingAddress("123 Test St")
                    .build();

            testCart.getCartItemIds().add(cartItemId);
            testCart.setSubtotal(200.0);

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenReturn(testProduct);
            when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
            when(loyaltyCardService.addPointsForCart(any(), anyDouble()))
                    .thenReturn(LoyaltyCardResponse.builder().build());
            when(cartMapper.toResponse(any(Cart.class))).thenReturn(createCartResponse(testCart));

            CartResponse result = cartService.checkout(userId, request);

            assertNotNull(result);
            verify(productRepository).save(any(Product.class));
            verify(loyaltyCardService).addPointsForCart(any(), anyDouble());
        }

        @Test
        @DisplayName("Should throw exception for empty cart checkout")
        void checkout_EmptyCart_ThrowsException() {
            CheckoutRequest request = CheckoutRequest.builder().build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(Collections.emptyList());

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.checkout(userId, request));
        }

        @Test
        @DisplayName("Should throw exception when no cart found for checkout")
        void checkout_NoCart_ThrowsException() {
            CheckoutRequest request = CheckoutRequest.builder().build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.empty());

            assertThrows(CartNotFoundException.class,
                    () -> cartService.checkout(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for insufficient stock during checkout")
        void checkout_InsufficientStock_ThrowsException() {
            CheckoutRequest request = CheckoutRequest.builder().build();
            testCartItem.setQuantity(100);
            testCart.getCartItemIds().add(cartItemId);

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));

            assertThrows(InsufficientStockException.class,
                    () -> cartService.checkout(userId, request));
        }

        @Test
        @DisplayName("Should increment coupon usage on successful checkout")
        void checkout_WithCoupon_IncrementsUsage() {
            Coupons coupon = Coupons.builder()
                    .code("SAVE10")
                    .active(true)
                    .usageCount(5)
                    .usageLimit(100)
                    .build();

            testCart.setAppliedCouponCode("SAVE10");
            testCart.setSubtotal(200.0);
            testCart.getCartItemIds().add(cartItemId);

            CheckoutRequest request = CheckoutRequest.builder().build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenReturn(testProduct);
            when(couponRepository.save(any(Coupons.class))).thenReturn(coupon);
            when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
            when(loyaltyCardService.addPointsForCart(any(), anyDouble()))
                    .thenReturn(LoyaltyCardResponse.builder().build());
            when(cartMapper.toResponse(any(Cart.class))).thenReturn(createCartResponse(testCart));

            cartService.checkout(userId, request);

            verify(couponRepository).save(any(Coupons.class));
        }

        @Test
        @DisplayName("Should auto-deactivate coupon when usage limit reached at checkout")
        void checkout_CouponLimitReached_Deactivates() {
            Coupons coupon = Coupons.builder()
                    .code("SAVE10")
                    .active(true)
                    .usageCount(99)
                    .usageLimit(100)
                    .build();

            testCart.setAppliedCouponCode("SAVE10");
            testCart.setSubtotal(200.0);
            testCart.getCartItemIds().add(cartItemId);

            CheckoutRequest request = CheckoutRequest.builder().build();

            when(cartRepository.findByUserIdAndStatus(userId, CartStatus.DRAFT))
                    .thenReturn(Optional.of(testCart));
            when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenReturn(testProduct);
            when(couponRepository.save(any(Coupons.class))).thenReturn(coupon);
            when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
            when(loyaltyCardService.addPointsForCart(any(), anyDouble()))
                    .thenReturn(LoyaltyCardResponse.builder().build());
            when(cartMapper.toResponse(any(Cart.class))).thenReturn(createCartResponse(testCart));

            cartService.checkout(userId, request);

            verify(couponRepository).save(argThat(c -> !c.getActive()));
        }
    }

    // ==================== CANCEL ORDER TESTS ====================

    @Nested
    @DisplayName("cancelOrder Tests - Order Cancellation")
    class CancelOrderTests {

        @Test
        @DisplayName("Should cancel confirmed order successfully")
        void cancelOrder_ConfirmedOrder_Success() {
            ObjectId orderId = new ObjectId();
            Cart order = Cart.builder()
                    .id(orderId)
                    .userId(userId)
                    .status(CartStatus.CONFIRMED)
                    .subtotal(200.0)
                    .total(236.0)
                    .build();

            CartItem item = CartItem.builder()
                    .id(cartItemId)
                    .cartId(orderId)
                    .productId(productId)
                    .productName("Test Product")
                    .quantity(2)
                    .unitPrice(100.0)
                    .status(CartItemStatus.ACTIVE)
                    .build();

            CancelOrderRequest request = CancelOrderRequest.builder()
                    .reason("Changed my mind")
                    .build();

            when(cartRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(cartItemRepository.findByCartId(orderId)).thenReturn(List.of(item));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenReturn(testProduct);
            when(cartItemRepository.save(any(CartItem.class))).thenReturn(item);
            when(loyaltyCardService.calculatePointsForAmount(any(), anyDouble())).thenReturn(100);
            when(loyaltyCardService.deductPoints(any(), anyInt())).thenReturn(100);
            when(cartRepository.save(any(Cart.class))).thenReturn(order);

            RefundSummaryDTO result = cartService.cancelOrder(userId, orderId, request);

            assertNotNull(result);
            assertEquals(CartStatus.CANCELLED, order.getStatus());
            verify(productRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("Should cancel PAID order successfully")
        void cancelOrder_PaidOrder_Success() {
            ObjectId orderId = new ObjectId();
            Cart order = Cart.builder()
                    .id(orderId)
                    .userId(userId)
                    .status(CartStatus.PAID)
                    .subtotal(200.0)
                    .total(236.0)
                    .build();

            when(cartRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(cartItemRepository.findByCartId(orderId)).thenReturn(Collections.emptyList());
            when(loyaltyCardService.calculatePointsForAmount(any(), anyDouble())).thenReturn(100);
            when(loyaltyCardService.deductPoints(any(), anyInt())).thenReturn(100);
            when(cartRepository.save(any(Cart.class))).thenReturn(order);

            RefundSummaryDTO result = cartService.cancelOrder(userId, orderId, null);

            assertNotNull(result);
            assertEquals(CartStatus.CANCELLED, order.getStatus());
        }

        @Test
        @DisplayName("Should throw exception when order doesn't belong to user")
        void cancelOrder_WrongUser_ThrowsException() {
            ObjectId orderId = new ObjectId();
            ObjectId differentUserId = new ObjectId();
            Cart order = Cart.builder()
                    .id(orderId)
                    .userId(differentUserId)
                    .status(CartStatus.CONFIRMED)
                    .build();

            when(cartRepository.findById(orderId)).thenReturn(Optional.of(order));

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.cancelOrder(userId, orderId, null));
        }

        @Test
        @DisplayName("Should throw exception for DRAFT status cancellation")
        void cancelOrder_DraftStatus_ThrowsException() {
            ObjectId orderId = new ObjectId();
            Cart order = Cart.builder()
                    .id(orderId)
                    .userId(userId)
                    .status(CartStatus.DRAFT)
                    .build();

            when(cartRepository.findById(orderId)).thenReturn(Optional.of(order));

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.cancelOrder(userId, orderId, null));
        }

        @Test
        @DisplayName("Should throw exception when order not found")
        void cancelOrder_NotFound_ThrowsException() {
            ObjectId orderId = new ObjectId();

            when(cartRepository.findById(orderId)).thenReturn(Optional.empty());

            assertThrows(CartNotFoundException.class,
                    () -> cartService.cancelOrder(userId, orderId, null));
        }

        @Test
        @DisplayName("Should decrement coupon usage on order cancellation")
        void cancelOrder_WithCoupon_DecrementsCouponUsage() {
            ObjectId orderId = new ObjectId();
            Coupons coupon = Coupons.builder()
                    .code("SAVE10")
                    .usageCount(5)
                    .usageLimit(100)
                    .active(true)
                    .build();

            Cart order = Cart.builder()
                    .id(orderId)
                    .userId(userId)
                    .status(CartStatus.CONFIRMED)
                    .subtotal(200.0)
                    .total(236.0)
                    .appliedCouponCode("SAVE10")
                    .build();

            when(cartRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(cartItemRepository.findByCartId(orderId)).thenReturn(Collections.emptyList());
            when(couponRepository.findByCode("SAVE10")).thenReturn(Optional.of(coupon));
            when(couponRepository.save(any(Coupons.class))).thenReturn(coupon);
            when(loyaltyCardService.calculatePointsForAmount(any(), anyDouble())).thenReturn(100);
            when(loyaltyCardService.deductPoints(any(), anyInt())).thenReturn(100);
            when(cartRepository.save(any(Cart.class))).thenReturn(order);

            cartService.cancelOrder(userId, orderId, null);

            verify(couponRepository).save(argThat(c -> c.getUsageCount() == 4));
        }
    }

    // ==================== CANCEL ORDER ITEM TESTS ====================

    @Nested
    @DisplayName("cancelOrderItem Tests - Partial Cancellation")
    class CancelOrderItemTests {

        @Test
        @DisplayName("Should partially cancel order item")
        void cancelOrderItem_PartialCancellation_Success() {
            ObjectId orderId = new ObjectId();
            Cart order = Cart.builder()
                    .id(orderId)
                    .userId(userId)
                    .status(CartStatus.CONFIRMED)
                    .subtotal(200.0)
                    .total(236.0)
                    .build();

            CartItem item = CartItem.builder()
                    .id(cartItemId)
                    .cartId(orderId)
                    .productId(productId)
                    .productName("Test Product")
                    .quantity(5)
                    .unitPrice(100.0)
                    .status(CartItemStatus.ACTIVE)
                    .cancelledQuantity(0)
                    .build();

            CancelOrderItemRequest request = CancelOrderItemRequest.builder()
                    .cartItemId(cartItemId.toHexString())
                    .quantityToCancel(2)
                    .reason("Partial cancel")
                    .build();

            when(cartRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(item));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenReturn(testProduct);
            when(cartItemRepository.save(any(CartItem.class))).thenReturn(item);
            when(loyaltyCardService.calculatePointsForAmount(any(), anyDouble())).thenReturn(50);
            when(loyaltyCardService.deductPoints(any(), anyInt())).thenReturn(50);
            when(cartRepository.save(any(Cart.class))).thenReturn(order);
            when(cartItemRepository.findByCartId(orderId)).thenReturn(List.of(item));

            RefundSummaryDTO result = cartService.cancelOrderItem(userId, orderId, request);

            assertNotNull(result);
            assertEquals(CartItemStatus.PARTIALLY_CANCELLED, item.getStatus());
        }

        @Test
        @DisplayName("Should fully cancel item when all quantity cancelled")
        void cancelOrderItem_FullCancellation_Success() {
            ObjectId orderId = new ObjectId();
            Cart order = Cart.builder()
                    .id(orderId)
                    .userId(userId)
                    .status(CartStatus.CONFIRMED)
                    .subtotal(200.0)
                    .total(236.0)
                    .build();

            CartItem item = CartItem.builder()
                    .id(cartItemId)
                    .cartId(orderId)
                    .productId(productId)
                    .productName("Test Product")
                    .quantity(5)
                    .unitPrice(100.0)
                    .status(CartItemStatus.ACTIVE)
                    .cancelledQuantity(0)
                    .build();

            CancelOrderItemRequest request = CancelOrderItemRequest.builder()
                    .cartItemId(cartItemId.toHexString())
                    .quantityToCancel(5)
                    .reason("Full cancel")
                    .build();

            when(cartRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(item));
            when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenReturn(testProduct);
            when(cartItemRepository.save(any(CartItem.class))).thenReturn(item);
            when(loyaltyCardService.calculatePointsForAmount(any(), anyDouble())).thenReturn(100);
            when(loyaltyCardService.deductPoints(any(), anyInt())).thenReturn(100);
            when(cartRepository.save(any(Cart.class))).thenReturn(order);
            when(cartItemRepository.findByCartId(orderId)).thenReturn(List.of(item));

            RefundSummaryDTO result = cartService.cancelOrderItem(userId, orderId, request);

            assertNotNull(result);
            assertEquals(CartItemStatus.CANCELLED, item.getStatus());
        }

        @Test
        @DisplayName("Should throw exception when item already fully cancelled")
        void cancelOrderItem_AlreadyCancelled_ThrowsException() {
            ObjectId orderId = new ObjectId();
            Cart order = Cart.builder()
                    .id(orderId)
                    .userId(userId)
                    .status(CartStatus.CONFIRMED)
                    .build();

            CartItem item = CartItem.builder()
                    .id(cartItemId)
                    .cartId(orderId)
                    .status(CartItemStatus.CANCELLED)
                    .build();

            CancelOrderItemRequest request = CancelOrderItemRequest.builder()
                    .cartItemId(cartItemId.toHexString())
                    .build();

            when(cartRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(item));

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.cancelOrderItem(userId, orderId, request));
        }

        @Test
        @DisplayName("Should throw exception when cancelling more than available")
        void cancelOrderItem_ExceedsAvailable_ThrowsException() {
            ObjectId orderId = new ObjectId();
            Cart order = Cart.builder()
                    .id(orderId)
                    .userId(userId)
                    .status(CartStatus.CONFIRMED)
                    .build();

            CartItem item = CartItem.builder()
                    .id(cartItemId)
                    .cartId(orderId)
                    .quantity(5)
                    .cancelledQuantity(3)
                    .status(CartItemStatus.PARTIALLY_CANCELLED)
                    .build();

            CancelOrderItemRequest request = CancelOrderItemRequest.builder()
                    .cartItemId(cartItemId.toHexString())
                    .quantityToCancel(5)
                    .build();

            when(cartRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(item));

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.cancelOrderItem(userId, orderId, request));
        }

        @Test
        @DisplayName("Should throw exception when item doesn't belong to order")
        void cancelOrderItem_ItemNotInOrder_ThrowsException() {
            ObjectId orderId = new ObjectId();
            ObjectId differentOrderId = new ObjectId();
            Cart order = Cart.builder()
                    .id(orderId)
                    .userId(userId)
                    .status(CartStatus.CONFIRMED)
                    .build();

            CartItem item = CartItem.builder()
                    .id(cartItemId)
                    .cartId(differentOrderId)
                    .status(CartItemStatus.ACTIVE)
                    .build();

            CancelOrderItemRequest request = CancelOrderItemRequest.builder()
                    .cartItemId(cartItemId.toHexString())
                    .build();

            when(cartRepository.findById(orderId)).thenReturn(Optional.of(order));
            when(cartItemRepository.findById(cartItemId)).thenReturn(Optional.of(item));

            assertThrows(IllegalArgumentException.class,
                    () -> cartService.cancelOrderItem(userId, orderId, request));
        }
    }

    // ==================== GET USER ORDERS TESTS ====================

    @Nested
    @DisplayName("getUserOrders Tests")
    class GetUserOrdersTests {

        @Test
        @DisplayName("Should return only non-DRAFT orders")
        void getUserOrders_ReturnsOnlyOrders() {
            Cart draftCart = Cart.builder()
                    .id(new ObjectId())
                    .userId(userId)
                    .status(CartStatus.DRAFT)
                    .build();

            Cart confirmedOrder = Cart.builder()
                    .id(new ObjectId())
                    .userId(userId)
                    .status(CartStatus.CONFIRMED)
                    .build();

            Cart paidOrder = Cart.builder()
                    .id(new ObjectId())
                    .userId(userId)
                    .status(CartStatus.PAID)
                    .build();

            when(cartRepository.findByUserId(userId))
                    .thenReturn(List.of(draftCart, confirmedOrder, paidOrder));
            when(cartMapper.toResponse(confirmedOrder)).thenReturn(createCartResponse(confirmedOrder));
            when(cartMapper.toResponse(paidOrder)).thenReturn(createCartResponse(paidOrder));

            List<CartResponse> result = cartService.getUserOrders(userId);

            assertEquals(2, result.size());
        }

        @Test
        @DisplayName("Should return empty list when no orders")
        void getUserOrders_NoOrders_ReturnsEmpty() {
            when(cartRepository.findByUserId(userId)).thenReturn(Collections.emptyList());

            List<CartResponse> result = cartService.getUserOrders(userId);

            assertTrue(result.isEmpty());
        }
    }

    // ==================== PRICE CALCULATION TESTS ====================

    @Nested
    @DisplayName("Price Calculation Tests")
    class PriceCalculationTests {

        @Test
        @DisplayName("Should calculate subtotal correctly")
        void priceCalculation_Subtotal_Correct() {
            CartItem item1 = CartItem.builder().subTotal(100.0).build();
            CartItem item2 = CartItem.builder().subTotal(150.0).build();

            double expectedSubtotal = 250.0;
            double actualSubtotal = item1.getSubTotal() + item2.getSubTotal();

            assertEquals(expectedSubtotal, actualSubtotal);
        }

        @Test
        @DisplayName("Should calculate tax at 18% rate")
        void priceCalculation_Tax_Correct() {
            double subtotal = 100.0;
            double expectedTax = 18.0;
            double actualTax = subtotal * 0.18;

            assertEquals(expectedTax, actualTax, 0.01);
        }

        @Test
        @DisplayName("Should calculate percentage discount correctly")
        void priceCalculation_PercentageDiscount_Correct() {
            double subtotal = 100.0;
            double discountPercentage = 10.0;
            double expectedDiscount = 10.0;

            double actualDiscount = subtotal * (discountPercentage / 100.0);

            assertEquals(expectedDiscount, actualDiscount, 0.01);
        }

        @Test
        @DisplayName("Should calculate fixed discount correctly")
        void priceCalculation_FixedDiscount_Correct() {
            double subtotal = 100.0;
            double fixedDiscount = 15.0;

            double actualDiscount = Math.min(fixedDiscount, subtotal);

            assertEquals(15.0, actualDiscount, 0.01);
        }

        @Test
        @DisplayName("Should cap fixed discount at subtotal")
        void priceCalculation_FixedDiscountCap_Correct() {
            double subtotal = 10.0;
            double fixedDiscount = 50.0;

            double actualDiscount = Math.min(fixedDiscount, subtotal);

            assertEquals(subtotal, actualDiscount, 0.01);
        }

        @Test
        @DisplayName("Should calculate total correctly (subtotal - discount + tax)")
        void priceCalculation_Total_Correct() {
            double subtotal = 100.0;
            double discount = 10.0;
            double afterDiscount = subtotal - discount;
            double tax = afterDiscount * 0.18;
            double expectedTotal = afterDiscount + tax;

            assertEquals(106.2, expectedTotal, 0.01);
        }

        @Test
        @DisplayName("Should not allow negative total")
        void priceCalculation_NoNegativeTotal() {
            double subtotal = 50.0;
            double discount = 100.0;

            double afterDiscount = Math.max(0, subtotal - discount);

            assertTrue(afterDiscount >= 0);
        }

        @Test
        @DisplayName("Should calculate item subtotal correctly")
        void priceCalculation_ItemSubtotal_Correct() {
            double unitPrice = 25.50;
            int quantity = 4;
            double expectedSubtotal = 102.0;

            double actualSubtotal = unitPrice * quantity;

            assertEquals(expectedSubtotal, actualSubtotal, 0.01);
        }
    }

    // ==================== HELPER METHODS ====================

    private CartResponse createCartResponse(Cart cart) {
        return CartResponse.builder()
                .id(cart.getId() != null ? cart.getId().toHexString() : null)
                .userId(cart.getUserId() != null ? cart.getUserId().toHexString() : null)
                .status(cart.getStatus())
                .subtotal(cart.getSubtotal())
                .discountAmount(cart.getDiscountAmount())
                .taxAmount(cart.getTaxAmount())
                .total(cart.getTotal())
                .build();
    }

    private CartItemResponse createCartItemResponse(CartItem item) {
        return CartItemResponse.builder()
                .id(item.getId() != null ? item.getId().toHexString() : null)
                .cartId(item.getCartId() != null ? item.getCartId().toHexString() : null)
                .productId(item.getProductId() != null ? item.getProductId().toHexString() : null)
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subTotal(item.getSubTotal())
                .status(item.getStatus())
                .build();
    }
}
