package esprit_market.dto.paymentDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardOtpConfirmationRequest {
    @NotBlank
    private String verificationId;

    @NotBlank
    @Pattern(regexp = "\\d{6}", message = "otpCode must contain 6 digits")
    private String otpCode;
}
