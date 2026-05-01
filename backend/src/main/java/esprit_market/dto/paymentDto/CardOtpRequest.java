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
public class CardOtpRequest {
    @NotBlank
    @Pattern(regexp = "\\d{4}", message = "cardLast4 must contain 4 digits")
    private String cardLast4;

    private String cardBrand;

    @NotBlank
    private String expiryMonth;

    @NotBlank
    private String expiryYear;

    @NotBlank
    private String cardholderName;
}
