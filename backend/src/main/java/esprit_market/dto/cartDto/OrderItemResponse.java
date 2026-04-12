package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.OrderItemStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private String id;
    private String orderId;
    private String productId;
    private String productName;
    private Double productPrice;
    private Integer quantity;
    private Double subtotal;
    private OrderItemStatus status;
    private Integer cancelledQuantity;
    private Double refundedAmount;
}
