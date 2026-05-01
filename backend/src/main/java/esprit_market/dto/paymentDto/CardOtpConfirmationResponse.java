package esprit_market.dto.paymentDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardOtpConfirmationResponse {
    private String transactionId;
    private String status;
    private String message;
}
