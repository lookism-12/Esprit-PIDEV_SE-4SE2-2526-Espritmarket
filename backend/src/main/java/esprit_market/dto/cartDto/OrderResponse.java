package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private String id;
    private String userId;
    private String userEmail;
    private String orderNumber;
    private OrderStatus status;
    
    private Double totalAmount;
    private Double discountAmount;
    private Double finalAmount;
    
    private String couponCode;
    private String discountId;
    
    private String shippingAddress;
    private String paymentMethod;
    private String paymentId;
    
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private LocalDateTime lastUpdated;
    
    private String cancellationReason;
    private LocalDateTime cancelledAt;
    
    private List<OrderItemResponse> items;
}
