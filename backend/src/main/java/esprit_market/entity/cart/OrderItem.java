package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.OrderItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * OrderItem represents a product in a completed order.
 * 
 * This is a snapshot of the product at the time of purchase.
 * Price and name are denormalized to preserve order history.
 */
@Document(collection = "order_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {
    
    @Id
    private ObjectId id;
    
    private ObjectId orderId;
    
    // Product snapshot (denormalized for history)
    private ObjectId productId;
    private String productName;
    private Double productPrice;
    
    // ✅ CRITICAL: Shop tracking for provider filtering
    private ObjectId shopId;  // Added to filter orders by provider's shop
    
    // Quantity & pricing
    private Integer quantity;
    private Double subtotal;
    
    // Status tracking
    private OrderItemStatus status;
    
    // Cancellation/Refund tracking
    private Integer cancelledQuantity;
    private Double refundedAmount;
}
