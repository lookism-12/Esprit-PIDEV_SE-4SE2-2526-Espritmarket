package esprit_market.dto.paymentDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StripePaymentIntentResponse {
    private String paymentIntentId;
    private String clientSecret;
    private String publishableKey;
    private Long amount;
    private Double displayAmount;
    private String currency;
    private String status;
}
