package esprit_market.service.cartService;

import esprit_market.dto.cartDto.*;
import org.bson.types.ObjectId;

import java.util.List;

public interface IOrderService {
    
    // Create order from cart
    OrderResponse createOrderFromCart(ObjectId userId, CreateOrderRequest request);
    
    // Get orders
    List<OrderResponse> getUserOrders(ObjectId userId);
    org.springframework.data.domain.Page<OrderResponse> getUserOrdersPaginated(ObjectId userId, org.springframework.data.domain.Pageable pageable);
    OrderResponse getOrderById(ObjectId userId, ObjectId orderId);
    OrderResponse getOrderByNumber(String orderNumber);
    
    // Payment confirmation
    OrderResponse confirmPayment(ObjectId userId, ObjectId orderId, String paymentId);
    
    // Order lifecycle
    OrderResponse updateOrderStatus(ObjectId orderId, String status);
    OrderResponse updateOrderStatus(ObjectId orderId, String status, String actor);
    
    // Order confirmation & decline
    OrderResponse confirmOrder(ObjectId userId, ObjectId orderId);
    RefundSummaryDTO declineOrder(ObjectId userId, ObjectId orderId, CancelOrderRequest request);
    
    // Order validation
    boolean canClientCancelOrder(ObjectId orderId);
    
    // Cancellation & Refund
    RefundSummaryDTO cancelOrder(ObjectId userId, ObjectId orderId, CancelOrderRequest request);
    RefundSummaryDTO cancelOrderItem(ObjectId userId, ObjectId orderId, CancelOrderItemRequest request);
    RefundSummaryDTO getRefundSummary(ObjectId userId, ObjectId orderId);
    
    // Admin operations
    List<OrderResponse> getAllOrders();
    List<OrderResponse> getOrdersByStatus(String status);
    
    /**
     * Get order by ID (admin/provider access - no user validation)
     */
    OrderResponse getOrderByIdAdmin(ObjectId orderId);
    
    /**
     * Get all purchased items for a user from completed orders
     */
    List<CartItemResponse> getPurchasedItemsForUser(ObjectId userId);
    
    /**
     * Provider confirms physical pickup of returned order
     * Restores stock after provider receives the returned product
     */
    OrderResponse confirmPickup(ObjectId orderId);
}
