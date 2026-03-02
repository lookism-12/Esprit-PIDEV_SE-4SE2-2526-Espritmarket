package esprit_market.dto.cartDto;

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
