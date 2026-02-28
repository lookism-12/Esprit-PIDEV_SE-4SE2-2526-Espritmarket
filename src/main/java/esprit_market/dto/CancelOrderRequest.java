package esprit_market.dto;

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
