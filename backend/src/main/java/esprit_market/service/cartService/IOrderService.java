package esprit_market.service.cartService;

import esprit_market.dto.cartDto.*;
import org.bson.types.ObjectId;

import java.util.List;

public interface IOrderService {
    
    // Create order from cart
    OrderResponse createOrderFromCart(ObjectId userId, CreateOrderRequest request);
    
    // Get orders
    List<OrderResponse> getUserOrders(ObjectId userId);
    OrderResponse getOrderById(ObjectId userId, ObjectId orderId);
    OrderResponse getOrderByNumber(String orderNumber);
    
    // Payment confirmation
    OrderResponse confirmPayment(ObjectId userId, ObjectId orderId, String paymentId);
    
    // Order lifecycle
    OrderResponse updateOrderStatus(ObjectId orderId, String status);
    
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
}
