package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.entity.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Order entity represents a completed checkout/purchase.
 * 
 * Lifecycle:
 * - PENDING: Order created, waiting for payment
 * - PAID: Payment confirmed, stock reduced
 * - PROCESSING: Order being prepared
 * - SHIPPED: Order shipped to customer
 * - DELIVERED: Order delivered successfully
 * - CANCELLED: Order cancelled, stock restored
 * - REFUNDED: Order refunded, stock restored
 * 
 * This entity is separate from Cart (shopping basket).
 */
@Document(collection = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    
    @Id
    private ObjectId id;
    
    @DBRef
    private User user;
    
    private OrderStatus status;
    
    // Pricing
    private Double totalAmount;
    private Double discountAmount;
    private Double finalAmount;
    
    // Discount/Coupon tracking
    private String couponCode;
    private ObjectId discountId;
    
    // Shipping & Payment
    private String shippingAddress;
    private String paymentMethod;
    private String paymentId;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private LocalDateTime lastUpdated;
    
    // Order tracking
    private String orderNumber; // Human-readable order number (e.g., ORD-2026-0001)
    
    // Cancellation tracking
    private String cancellationReason;
    private LocalDateTime cancelledAt;
}
