package esprit_market.dto.paymentDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardOtpResponse {
    private String verificationId;
    private String maskedCard;
    private String maskedPhone;
    private LocalDateTime expiresAt;
    private String status;
    private String message;
}
