package esprit_market.controller.cartController;

import esprit_market.dto.cartDto.*;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.AuthHelperService;
import esprit_market.service.cartService.ICartService;
import esprit_market.service.cartService.IOrderService;
import esprit_market.service.cartService.UserNotAuthenticatedException;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final ICartService cartService;
    private final IOrderService orderService;  // ✅ ADDED: For proper order creation
    private final AuthHelperService authHelper;
    private final UserRepository userRepository;

    // ==================== USER RESOLUTION ====================

    private ObjectId getUserId(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UserNotAuthenticatedException("User not authenticated");
        }

        // 1. Try JWT / Security context first
        try {
            return authHelper.getUserIdFromAuthentication(authentication);
        } catch (Exception ignored) {
            // fallback to test user (DEV ONLY)
        }

        // 2. DEV fallback only (remove in production)
        User testClient = userRepository.findByEmail("client@test.com").orElse(null);
        if (testClient != null) {
            return testClient.getId();
        }

        throw new UserNotAuthenticatedException("Cannot resolve user ID");
    }

    // ==================== CART ====================

    @GetMapping
    public ResponseEntity<CartResponse> getCart(Authentication authentication) {
        return ResponseEntity.ok(
                cartService.getOrCreateCart(getUserId(authentication))
        );
    }

    @GetMapping("/items")
    public ResponseEntity<List<CartItemResponse>> getCartItems(Authentication authentication) {

        ObjectId userId = getUserId(authentication);
        CartResponse cart = cartService.getOrCreateCart(userId);

        return ResponseEntity.ok(
                cartService.findByCartId(new ObjectId(cart.getId()))
        );
    }

    @PostMapping("/items")
    public ResponseEntity<CartItemResponse> addProductToCart(
            @Valid @RequestBody AddToCartRequest request,
            Authentication authentication) {

        ObjectId userId = getUserId(authentication);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                cartService.addProductToCart(userId, request)
        );
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartItemResponse> updateCartItemQuantity(
            @PathVariable String cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                cartService.updateCartItemQuantity(
                        getUserId(authentication),
                        new ObjectId(cartItemId),
                        request
                )
        );
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<Void> removeCartItem(
            @PathVariable String cartItemId,
            Authentication authentication) {

        cartService.removeCartItem(
                getUserId(authentication),
                new ObjectId(cartItemId)
        );

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(Authentication authentication) {

        cartService.clearCart(getUserId(authentication));
        return ResponseEntity.noContent().build();
    }

    // ==================== COUPONS ====================

    @PostMapping("/coupon")
    public ResponseEntity<CartResponse> applyCoupon(
            @Valid @RequestBody ApplyCouponRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                cartService.applyCoupon(getUserId(authentication), request)
        );
    }

    @DeleteMapping("/coupon")
    public ResponseEntity<CartResponse> removeCoupon(Authentication authentication) {

        return ResponseEntity.ok(
                cartService.removeCoupon(getUserId(authentication))
        );
    }

    // ==================== DISCOUNTS ====================

    @PostMapping("/discount/{discountId}")
    public ResponseEntity<CartResponse> applyDiscount(
            @PathVariable String discountId,
            Authentication authentication) {

        return ResponseEntity.ok(
                cartService.applyDiscount(
                        getUserId(authentication),
                        new ObjectId(discountId)
                )
        );
    }

    @DeleteMapping("/discount")
    public ResponseEntity<CartResponse> removeDiscount(Authentication authentication) {

        return ResponseEntity.ok(
                cartService.removeDiscount(getUserId(authentication))
        );
    }

    // ==================== CHECKOUT ====================

    /**
     * Checkout - Creates an Order entity from the current cart.
     * 
     * ✅ FIXED: This endpoint now properly creates Order entities in MongoDB.
     * 
     * Flow:
     * 1. Reads user's DRAFT cart
     * 2. Creates NEW Order entity (status = PENDING)
     * 3. Copies CartItems → OrderItems
     * 4. Saves Order to MongoDB orders collection
     * 5. Saves OrderItems to MongoDB order_items collection
     * 6. Clears the cart
     * 7. Returns OrderResponse
     * 
     * After checkout, use POST /api/orders/{id}/confirm-payment to confirm payment.
     * 
     * @param request CreateOrderRequest with shipping address and payment method
     * @param authentication User authentication
     * @return OrderResponse with created order details
     */
    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {

        ObjectId userId = getUserId(authentication);
        
        // ✅ FIXED: Now calls OrderService.createOrderFromCart()
        // This creates real Order entities in MongoDB
        OrderResponse order = orderService.createOrderFromCart(userId, request);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
}