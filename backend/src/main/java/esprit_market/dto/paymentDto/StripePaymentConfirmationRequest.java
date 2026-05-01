package esprit_market.dto.paymentDto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StripePaymentConfirmationRequest {
    @NotBlank
    private String orderId;

    @NotBlank
    private String paymentIntentId;
}
