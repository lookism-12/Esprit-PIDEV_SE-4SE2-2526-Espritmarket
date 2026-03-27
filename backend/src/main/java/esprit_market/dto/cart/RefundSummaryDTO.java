package esprit_market.dto.cart;

import esprit_market.Enum.cartEnum.CartItemStatus;
import esprit_market.Enum.cartEnum.CartStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundSummaryDTO {
    private String orderId;
    private CartStatus orderStatus;
    private Double originalTotal;
    private Double refundedAmount;
    private Double remainingTotal;
    private List<RefundedItemDTO> refundedItems;
    private LocalDateTime refundDate;
    private Integer loyaltyPointsDeducted;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefundedItemDTO {
        private String cartItemId;
        private String productName;
        private Integer cancelledQuantity;
        private Double refundAmount;
        private CartItemStatus status;
        private String reason;
    }
}
