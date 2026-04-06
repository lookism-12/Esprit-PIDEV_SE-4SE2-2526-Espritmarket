package esprit_market.controller.cartController;

import esprit_market.dto.cartDto.*;
import esprit_market.service.cartService.AuthHelperService;
import esprit_market.service.cartService.ICartService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN')")
public class CartController {

    private final ICartService cartService;
    private final AuthHelperService authHelper;

    private ObjectId getUserId(Authentication authentication) {
        return authHelper.getUserIdFromAuthentication(authentication);
    }

    // ==================== CART MANAGEMENT ====================

    @GetMapping
    public ResponseEntity<CartResponse> getCart(Authentication authentication) {
        ObjectId userId = getUserId(authentication);
        return ResponseEntity.ok(cartService.getOrCreateCart(userId));
    }

    @PostMapping("/items")
    public ResponseEntity<CartItemResponse> addProductToCart(
            @Valid @RequestBody AddToCartRequest request,
            Authentication authentication) {

        ObjectId userId = getUserId(authentication);
        CartItemResponse item = cartService.addProductToCart(userId, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartItemResponse> updateCartItemQuantity(
            @PathVariable String cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication) {

        ObjectId userId = getUserId(authentication);
        return ResponseEntity.ok(
                cartService.updateCartItemQuantity(userId, new ObjectId(cartItemId), request)
        );
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<Void> removeCartItem(
            @PathVariable String cartItemId,
            Authentication authentication) {

        ObjectId userId = getUserId(authentication);
        cartService.removeCartItem(userId, new ObjectId(cartItemId));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        cartService.clearCart(getUserId(authentication));
        return ResponseEntity.noContent().build();
    }

    // ==================== DISCOUNTS & COUPONS ====================

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

    @PostMapping("/discount/{discountId}")
    public ResponseEntity<CartResponse> applyDiscount(
            @PathVariable String discountId,
            Authentication authentication) {

        return ResponseEntity.ok(
                cartService.applyDiscount(getUserId(authentication), new ObjectId(discountId))
        );
    }

    @DeleteMapping("/discount")
    public ResponseEntity<CartResponse> removeDiscount(Authentication authentication) {
        return ResponseEntity.ok(
                cartService.removeDiscount(getUserId(authentication))
        );
    }

    // ==================== CHECKOUT ====================

    @PostMapping("/checkout")
    public ResponseEntity<CartResponse> checkout(
            @Valid @RequestBody CheckoutRequest request,
            Authentication authentication) {

        CartResponse order = cartService.checkout(getUserId(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    // ==================== ORDER MANAGEMENT ====================

    @GetMapping("/orders")
    public ResponseEntity<List<CartResponse>> getMyOrders(Authentication authentication) {
        return ResponseEntity.ok(
                cartService.getUserOrders(getUserId(authentication))
        );
    }
    
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<CartResponse> getOrderById(
            @PathVariable String orderId,
            Authentication authentication) {
        
        return ResponseEntity.ok(
                cartService.getOrderById(getUserId(authentication), new ObjectId(orderId))
        );
    }

    // ==================== CANCELLATION & REFUND ====================

    @PostMapping("/orders/{orderId}/cancel-item")
    public ResponseEntity<RefundSummaryDTO> cancelOrderItem(
            @PathVariable String orderId,
            @Valid @RequestBody CancelOrderItemRequest request,
            Authentication authentication) {
        
        RefundSummaryDTO refund = cartService.cancelOrderItem(
                getUserId(authentication), 
                new ObjectId(orderId), 
                request
        );
        return ResponseEntity.ok(refund);
    }

    @PostMapping("/orders/{orderId}/cancel")
    public ResponseEntity<RefundSummaryDTO> cancelOrder(
            @PathVariable String orderId,
            @RequestBody(required = false) CancelOrderRequest request,
            Authentication authentication) {
        
        RefundSummaryDTO refund = cartService.cancelOrder(
                getUserId(authentication), 
                new ObjectId(orderId), 
                request
        );
        return ResponseEntity.ok(refund);
    }

    @GetMapping("/orders/{orderId}/refund-summary")
    public ResponseEntity<RefundSummaryDTO> getRefundSummary(
            @PathVariable String orderId,
            Authentication authentication) {
        
        RefundSummaryDTO summary = cartService.getRefundSummary(
                getUserId(authentication), 
                new ObjectId(orderId)
        );
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CartResponse>> getAllCarts() {
        return ResponseEntity.ok(cartService.findAllCarts());
    }
}