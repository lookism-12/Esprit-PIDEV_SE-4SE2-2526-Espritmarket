package esprit_market.service.cartService;

import esprit_market.dto.cartDto.*;
import org.bson.types.ObjectId;
import java.util.List;

public interface ICartService {
    // ==================== CART MANAGEMENT ====================
    CartResponse getOrCreateCart(ObjectId userId);
    CartResponse getCartByUserId(ObjectId userId);
    CartItemResponse addProductToCart(ObjectId userId, AddToCartRequest request);
    CartItemResponse updateCartItemQuantity(ObjectId userId, ObjectId cartItemId, UpdateCartItemRequest request);
    void removeCartItem(ObjectId userId, ObjectId cartItemId);
    void clearCart(ObjectId userId);
    
    // ==================== DISCOUNTS & COUPONS ====================
    CartResponse applyCoupon(ObjectId userId, ApplyCouponRequest request);
    CartResponse applyDiscount(ObjectId userId, ObjectId discountId);
    CartResponse removeCoupon(ObjectId userId);
    CartResponse removeDiscount(ObjectId userId);
    
    // ==================== CHECKOUT ====================
    CartResponse checkout(ObjectId userId, CheckoutRequest request);
    
    // ==================== ORDER MANAGEMENT ====================
    List<CartResponse> findAllCarts();
    List<CartItemResponse> findByCartId(ObjectId cartId);
    void deleteByCartId(ObjectId cartId);
    List<CartResponse> getUserOrders(ObjectId userId);
    CartResponse getOrderById(ObjectId userId, ObjectId orderId);
    
    // ==================== CANCELLATION & REFUND ====================
    /**
     * Cancel a specific item (or partial quantity) from a confirmed order.
     */
    RefundSummaryDTO cancelOrderItem(ObjectId userId, ObjectId orderId, CancelOrderItemRequest request);
    
    /**
     * Cancel entire order.
     */
    RefundSummaryDTO cancelOrder(ObjectId userId, ObjectId orderId, CancelOrderRequest request);
    
    /**
     * Get refund summary for an order showing all cancelled items and amounts.
     */
    RefundSummaryDTO getRefundSummary(ObjectId userId, ObjectId orderId);
}