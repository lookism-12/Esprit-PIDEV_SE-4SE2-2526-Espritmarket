package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.CartItemStatus;
import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.dto.cartDto.*;
import esprit_market.entity.cart.*;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.user.User;
import esprit_market.mappers.cartMapper.CartItemMapper;
import esprit_market.mappers.cartMapper.CartMapper;
import esprit_market.repository.cartRepository.CartItemRepository;
import esprit_market.repository.cartRepository.CartRepository;
import esprit_market.repository.cartRepository.CouponRepository;
import esprit_market.repository.cartRepository.DiscountRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.userRepository.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("CartServiceImpl Tests")
class CartServiceImplTest {

    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private CouponRepository couponRepository;
    @Mock private UserRepository userRepository;
    @Mock private CartMapper cartMapper;
    @Mock private CartItemMapper cartItemMapper;
    @Mock private LoyaltyCardServiceImpl loyaltyCardService;
    @Mock private StockManagementService stockManagementService;

    @InjectMocks private CartServiceImpl cartService;

    private ObjectId userId;
    private ObjectId cartId;
    private ObjectId productId;
    private User testUser;
    private Cart testCart;
    private Product testProduct;
    private CartItem testCartItem;

    @BeforeEach
    void setUp() throws Exception {
        try (var autoCloseable = MockitoAnnotations.openMocks(this)) {
            userId = new ObjectId();
            cartId = new ObjectId();
            productId = new ObjectId();
        
        testUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .build();
        
        testCart = Cart.builder()
                .id(cartId)
                .user(testUser)
                .status(CartStatus.DRAFT)
                .subtotal(100.0)
                .discountAmount(0.0)
                .taxAmount(18.0)
                .total(118.0)
                .cartItemIds(new ArrayList<>())
                .creationDate(LocalDateTime.now())
                .lastUpdated(LocalDateTime.now())
                .build();
        
        testProduct = Product.builder()
                .id(productId)
                .name("Test Product")
                .price(100.0)
                .stock(10)
                .quantity(10)
                .build();
        
        testCartItem = CartItem.builder()
                .id(new ObjectId())
                .cartId(cartId)
                .productId(productId)
                .productName("Test Product")
                .quantity(1)
                .unitPrice(100.0)
                .subTotal(100.0)
                .discountApplied(0.0)
                .status(CartItemStatus.ACTIVE)
                .build();
        }
    }

    @Test
    @DisplayName("getOrCreateCart_shouldCreateNewCart_whenCartDoesNotExist")
    void testGetOrCreateCart_ShouldCreateNewCart() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartRepository.findAllByUserAndStatus(testUser, CartStatus.DRAFT))
                .thenReturn(new ArrayList<>());
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
        when(cartMapper.toResponse(testCart)).thenReturn(new CartResponse());

        CartResponse result = cartService.getOrCreateCart(userId);

        assertNotNull(result);
        verify(userRepository).findById(userId);
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    @DisplayName("getOrCreateCart_shouldReturnExistingCart_whenCartExists")
    void testGetOrCreateCart_ShouldReturnExistingCart() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartRepository.findAllByUserAndStatus(testUser, CartStatus.DRAFT))
                .thenReturn(List.of(testCart));
        when(cartMapper.toResponse(testCart)).thenReturn(new CartResponse());

        CartResponse result = cartService.getOrCreateCart(userId);

        assertNotNull(result);
        verify(userRepository).findById(userId);
        verify(cartRepository, never()).save(any(Cart.class));
    }

    @Test
    @DisplayName("getOrCreateCart_shouldThrowException_whenUserNotFound")
    void testGetOrCreateCart_ShouldThrowException_WhenUserNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> cartService.getOrCreateCart(userId));
    }

    @Test
    @DisplayName("addProductToCart_shouldAddItemToCart")
    void testAddProductToCart_ShouldAddItemToCart() {
        AddToCartRequest request = new AddToCartRequest();
        request.setProductId(productId.toHexString());
        request.setQuantity(2);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartRepository.findAllByUserAndStatus(testUser, CartStatus.DRAFT))
                .thenReturn(List.of(testCart));
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        when(cartItemRepository.findByCartIdAndProductId(cartId, productId))
                .thenReturn(Optional.empty());
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(testCartItem);
        when(cartMapper.toResponse(any(Cart.class))).thenReturn(new CartResponse());
        when(cartItemMapper.toResponse(testCartItem)).thenReturn(new CartItemResponse());

        CartItemResponse result = cartService.addProductToCart(userId, request);

        assertNotNull(result);
        verify(stockManagementService).validateStockAvailability(productId, 2);
        verify(cartItemRepository).save(any(CartItem.class));
    }

    @Test
    @DisplayName("addProductToCart_shouldThrowException_whenInvalidQuantity")
    void testAddProductToCart_ShouldThrowException_WhenInvalidQuantity() {
        AddToCartRequest request = new AddToCartRequest();
        request.setProductId(productId.toHexString());
        request.setQuantity(0);

        assertThrows(IllegalArgumentException.class, () -> cartService.addProductToCart(userId, request));
    }

    @Test
    @DisplayName("addProductToCart_shouldThrowException_whenInsufficientStock")
    void testAddProductToCart_ShouldThrowException_WhenInsufficientStock() {
        AddToCartRequest request = new AddToCartRequest();
        request.setProductId(productId.toHexString());
        request.setQuantity(20);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartRepository.findAllByUserAndStatus(testUser, CartStatus.DRAFT))
                .thenReturn(List.of(testCart));
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        doThrow(new InsufficientStockException("Insufficient stock"))
                .when(stockManagementService).validateStockAvailability(productId, 20);

        assertThrows(InsufficientStockException.class, () -> cartService.addProductToCart(userId, request));
    }

    @Test
    @DisplayName("updateCartItemQuantity_shouldUpdateQuantity")
    void testUpdateCartItemQuantity_ShouldUpdateQuantity() {
        ObjectId itemId = testCartItem.getId();
        UpdateCartItemRequest request = new UpdateCartItemRequest();
        request.setQuantity(3);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartItemRepository.findById(itemId)).thenReturn(Optional.of(testCartItem));
        when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(testCartItem);
        when(cartItemMapper.toResponse(testCartItem)).thenReturn(new CartItemResponse());

        CartItemResponse result = cartService.updateCartItemQuantity(userId, itemId, request);

        assertNotNull(result);
        verify(cartItemRepository).save(any(CartItem.class));
    }

    @Test
    @DisplayName("removeItemFromCart_shouldRemoveItem")
    void testRemoveItemFromCart_ShouldRemoveItem() {
        ObjectId itemId = testCartItem.getId();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartRepository.findAllByUserAndStatus(testUser, CartStatus.DRAFT))
                .thenReturn(List.of(testCart));
        when(cartItemRepository.findById(itemId)).thenReturn(Optional.of(testCartItem));
        when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));

        cartService.removeCartItem(userId, itemId);

        verify(cartItemRepository).deleteById(itemId);
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    @DisplayName("applyCoupon_shouldValidateAndApply")
    void testApplyCoupon_ShouldValidateAndApply() {
        ApplyCouponRequest request = new ApplyCouponRequest();
        request.setCouponCode("TEST10");

        Coupons coupon = Coupons.builder()
                .id(new ObjectId())
                .code("TEST10")
                .active(true)
                .expirationDate(LocalDate.now().plusDays(10))
                .usageLimit(100)
                .usageCount(50)
                .minCartAmount(0.0)
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(10.0)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartRepository.findAllByUserAndStatus(testUser, CartStatus.DRAFT))
                .thenReturn(List.of(testCart));
        when(couponRepository.findByCode("TEST10")).thenReturn(Optional.of(coupon));
        when(cartItemRepository.findByCartId(cartId)).thenReturn(List.of(testCartItem));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
        when(cartMapper.toResponse(testCart)).thenReturn(new CartResponse());

        CartResponse result = cartService.applyCoupon(userId, request);

        assertNotNull(result);
        verify(couponRepository).findByCode("TEST10");
    }

    @Test
    @DisplayName("applyCoupon_shouldThrowException_whenCouponExpired")
    void testApplyCoupon_ShouldThrowException_WhenCouponExpired() {
        ApplyCouponRequest request = new ApplyCouponRequest();
        request.setCouponCode("EXPIRED");

        Coupons expiredCoupon = Coupons.builder()
                .code("EXPIRED")
                .expirationDate(LocalDate.now().minusDays(1))
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartRepository.findAllByUserAndStatus(testUser, CartStatus.DRAFT))
                .thenReturn(List.of(testCart));
        when(couponRepository.findByCode("EXPIRED")).thenReturn(Optional.of(expiredCoupon));

        assertThrows(CouponNotValidException.class, () -> cartService.applyCoupon(userId, request));
    }

    @Test
    @DisplayName("checkout_shouldTransitionToConfirmed")
    void testCheckout_ShouldTransitionToConfirmed() {
        CheckoutRequest request = new CheckoutRequest();
        request.setShippingAddress("123 Main St");
        request.setBillingAddress("123 Main St");

        testCart.setAppliedCouponCode(null);
        List<CartItem> items = List.of(testCartItem);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartRepository.findByUserAndStatus(testUser, CartStatus.DRAFT))
                .thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartId(cartId)).thenReturn(items);
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);
        when(cartMapper.toResponse(testCart)).thenReturn(new CartResponse());

        CartResponse result = cartService.checkout(userId, request);

        assertNotNull(result);
        verify(stockManagementService).batchReduceStock(any());
        verify(loyaltyCardService).addPointsForCart(userId, testCart.getTotal());
    }

    @Test
    @DisplayName("checkout_shouldThrowException_whenCartEmpty")
    void testCheckout_ShouldThrowException_WhenCartEmpty() {
        CheckoutRequest request = new CheckoutRequest();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartRepository.findByUserAndStatus(testUser, CartStatus.DRAFT))
                .thenReturn(Optional.of(testCart));
        when(cartItemRepository.findByCartId(cartId)).thenReturn(new ArrayList<>());

        assertThrows(IllegalArgumentException.class, () -> cartService.checkout(userId, request));
    }

    @Test
    @DisplayName("cancelOrderItem_shouldCancelAndRestoreStock")
    void testCancelOrderItem_ShouldCancelAndRestoreStock() {
        CancelOrderItemRequest request = new CancelOrderItemRequest();
        request.setCartItemId(testCartItem.getId().toHexString());
        request.setQuantityToCancel(1);

        testCart.setStatus(CartStatus.CONFIRMED);

        when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));
        when(cartItemRepository.findById(testCartItem.getId())).thenReturn(Optional.of(testCartItem));
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(testCartItem);
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

        RefundSummaryDTO result = cartService.cancelOrderItem(userId, cartId, request);

        assertNotNull(result);
        verify(stockManagementService).restoreStock(productId, 1);
    }

    @Test
    @DisplayName("getUserOrders_shouldReturnNonDraftCarts")
    void testGetUserOrders_ShouldReturnNonDraftCarts() {
        testCart.setStatus(CartStatus.PENDING);
        List<Cart> carts = List.of(testCart);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(cartRepository.findByUser(testUser)).thenReturn(carts);
        when(cartMapper.toResponse(testCart)).thenReturn(new CartResponse());

        List<CartResponse> result = cartService.getUserOrders(userId);

        assertNotNull(result);
        assertFalse(result.isEmpty());
        verify(cartRepository).findByUser(testUser);
    }

    @Test
    @DisplayName("getOrderById_shouldReturnOrder")
    void testGetOrderById_ShouldReturnOrder() {
        testCart.setStatus(CartStatus.PENDING);

        when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));
        when(cartMapper.toResponse(testCart)).thenReturn(new CartResponse());

        CartResponse result = cartService.getOrderById(userId, cartId);

        assertNotNull(result);
        verify(cartRepository).findById(cartId);
    }

    @Test
    @DisplayName("getOrderById_shouldThrowException_whenOrderNotFound")
    void testGetOrderById_ShouldThrowException_WhenOrderNotFound() {
        when(cartRepository.findById(cartId)).thenReturn(Optional.empty());

        assertThrows(CartNotFoundException.class, () -> cartService.getOrderById(userId, cartId));
    }

    @Test
    @DisplayName("findByCartId_shouldReturnCartItems")
    void testFindByCartId_ShouldReturnCartItems() {
        List<CartItem> items = List.of(testCartItem);

        when(cartItemRepository.findByCartId(cartId)).thenReturn(items);
        when(cartItemMapper.toResponse(testCartItem)).thenReturn(new CartItemResponse());

        List<CartItemResponse> result = cartService.findByCartId(cartId);

        assertNotNull(result);
        assertFalse(result.isEmpty());
    }

    @Test
    @DisplayName("clearCart_shouldRemoveAllItems")
    void testClearCart_ShouldRemoveAllItems() {
        when(cartRepository.findById(cartId)).thenReturn(Optional.of(testCart));
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

        cartService.clearCart(cartId);

        verify(cartRepository).save(any(Cart.class));
        assertEquals(0, testCart.getCartItemIds().size());
    }
}
