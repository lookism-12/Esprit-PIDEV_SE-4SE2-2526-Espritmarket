package esprit_market.dto.cart;

import lombok.*;

/**
 * Request DTO for cancelling an order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelOrderRequest {
    private String reason;
}
