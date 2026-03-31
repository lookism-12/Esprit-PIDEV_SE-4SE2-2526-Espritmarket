package esprit_market.dto.carpoolingDto;

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
public class DriverProfileRequestDTO {

    @NotBlank(message = "License number is required")
    @Pattern(regexp = "^[A-Za-z0-9-]{5,25}$", message = "Invalid license number format")
    private String licenseNumber;

    @NotBlank(message = "License document is required")
    private String licenseDocument;
}
