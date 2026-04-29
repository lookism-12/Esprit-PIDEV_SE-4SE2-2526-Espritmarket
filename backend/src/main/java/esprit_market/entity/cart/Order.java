package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.Enum.cartEnum.PaymentStatus;
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
 * - PENDING: Order created, waiting for provider confirmation
 * - CONFIRMED: Provider accepted, ready for delivery
 * - CANCELLED: Cancelled by provider/client/system
 * - OUT_FOR_DELIVERY: Delivery driver has taken the order
 * - DELIVERED: Successfully delivered
 * 
 * Payment Status (separate field):
 * - UNPAID: Cash on Delivery (not yet paid)
 * - PAID: Card payment or COD after delivery
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
    
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING_PAYMENT;
    
    // Pricing
    private Double totalAmount;
    private Double discountAmount;
    private Double finalAmount;
    
    // Discount/Coupon tracking
    private String couponCode;
    private ObjectId discountId;
    
    // Shipping & Payment
    private String shippingAddress;
    private String paymentMethod;  // "CARD" or "CASH"
    private String paymentId;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private LocalDateTime lastUpdated;
    private LocalDateTime confirmedAt;      // When provider confirmed
    private LocalDateTime preparingAt;      // When delivery started preparing
    private LocalDateTime deliveryStartedAt; // When delivery took order (in transit)
    private LocalDateTime deliveredAt;       // When delivered
    private LocalDateTime returnedAt;        // When returned to shop (failed delivery)
    private LocalDateTime restockedAt;       // When provider verified return and stock restored
    
    // Order tracking
    private String orderNumber; // Human-readable order number (e.g., ORD-2026-0001)
    private ObjectId cartId; // Link to original Cart (for backward compatibility with old deliveries)
    
    // Cancellation tracking
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    
    // Delivery tracking
    private ObjectId deliveryId; // Link to Delivery entity
}
