package esprit_market.dto.cartDto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelledOrderStatsDTO {

    private String orderId;
    private String orderNumber;
    private String userEmail;

    private String productName;
    private Integer quantity;

    private String shopId;

    private Double totalAmount;
}