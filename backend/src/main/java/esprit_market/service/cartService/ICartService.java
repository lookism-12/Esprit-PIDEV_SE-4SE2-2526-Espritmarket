package esprit_market.service.cartService;

import esprit_market.dto.cartDto.*;
import org.bson.types.ObjectId;
import java.util.List;

/**
 * Cart Service - ONLY for shopping cart operations.
 * 
 * This service handles temporary shopping basket functionality:
 * - Add/remove/update items
 * - Apply coupons/discounts
 * - Calculate totals
 * 
 * For order operations (checkout, payment, shipping), use IOrderService.
 */
public interface ICartService {
    
    // ==================== CART MANAGEMENT ====================
    
    /**
     * Get or create a DRAFT cart for the user.
     */
    CartResponse getOrCreateCart(ObjectId userId);
    
    /**
     * Get cart by user ID.
     */
    CartResponse getCartByUserId(ObjectId userId);
    
    /**
     * Add a product to the cart.
     */
    CartItemResponse addProductToCart(ObjectId userId, AddToCartRequest request);
    
    /**
     * Update quantity of an item in the cart.
     */
    CartItemResponse updateCartItemQuantity(ObjectId userId, ObjectId cartItemId, UpdateCartItemRequest request);
    
    /**
     * Remove an item from the cart.
     */
    void removeCartItem(ObjectId userId, ObjectId cartItemId);
    
    /**
     * Clear all items from the cart.
     */
    void clearCart(ObjectId userId);
    
    // ==================== DISCOUNTS & COUPONS ====================
    
    /**
     * Apply a coupon to the cart.
     */
    CartResponse applyCoupon(ObjectId userId, ApplyCouponRequest request);
    
    /**
     * Apply a discount to the cart.
     */
    CartResponse applyDiscount(ObjectId userId, ObjectId discountId);
    
    /**
     * Remove coupon from the cart.
     */
    CartResponse removeCoupon(ObjectId userId);
    
    /**
     * Remove discount from the cart.
     */
    CartResponse removeDiscount(ObjectId userId);
    
    // ==================== CART ITEMS ====================
    
    /**
     * Get all items in a cart.
     */
    List<CartItemResponse> findByCartId(ObjectId cartId);
    
    /**
     * Delete all items in a cart.
     */
    void deleteByCartId(ObjectId cartId);
    
    // ==================== ADMIN OPERATIONS ====================
    
    /**
     * Get all carts (admin only).
     */
    List<CartResponse> findAllCarts();
    
    // ==================== DEPRECATED METHODS ====================
    // These methods are kept for backward compatibility only.
    // New code should use IOrderService instead.
    
    /**
     * @deprecated Use IOrderService.createOrderFromCart() instead
     */
    @Deprecated
    CartResponse checkout(ObjectId userId, CheckoutRequest request);
    
    /**
     * @deprecated Use IOrderService.getUserOrders() instead
     */
    @Deprecated
    List<CartResponse> getUserOrders(ObjectId userId);
    
    /**
     * @deprecated Use IOrderService.getOrderById() instead
     */
    @Deprecated
    CartResponse getOrderById(ObjectId userId, ObjectId orderId);
    
    /**
     * @deprecated Use IOrderService.cancelOrderItem() instead
     */
    @Deprecated
    RefundSummaryDTO cancelOrderItem(ObjectId userId, ObjectId orderId, CancelOrderItemRequest request);
    
    /**
     * @deprecated Use IOrderService.cancelOrder() instead
     */
    @Deprecated
    RefundSummaryDTO cancelOrder(ObjectId userId, ObjectId orderId, CancelOrderRequest request);
    
    /**
     * @deprecated Use IOrderService.getRefundSummary() instead
     */
    @Deprecated
    RefundSummaryDTO getRefundSummary(ObjectId userId, ObjectId orderId);
    
    /**
     * @deprecated Use IOrderService.updateOrderStatus() instead
     */
    @Deprecated
    CartResponse updateOrderStatus(ObjectId userId, ObjectId orderId, esprit_market.Enum.cartEnum.CartStatus newStatus);
    
    /**
     * @deprecated Use IOrderService.getOrdersByStatus() instead
     */
    @Deprecated
    List<CartResponse> getUserOrdersByStatus(ObjectId userId, esprit_market.Enum.cartEnum.CartStatus status);
    
    /**
     * @deprecated Use IOrderService.confirmPayment() instead
     */
    @Deprecated
    CartResponse markOrderAsPaid(ObjectId userId, ObjectId orderId);
    
    /**
     * @deprecated Use IOrderService.updateOrderStatus() instead
     */
    @Deprecated
    CartResponse processOrder(ObjectId userId, ObjectId orderId);
    
    /**
     * @deprecated Use IOrderService.updateOrderStatus() instead
     */
    @Deprecated
    CartResponse shipOrder(ObjectId userId, ObjectId orderId);
    
    /**
     * @deprecated Use IOrderService.updateOrderStatus() instead
     */
    @Deprecated
    CartResponse deliverOrder(ObjectId userId, ObjectId orderId);
}