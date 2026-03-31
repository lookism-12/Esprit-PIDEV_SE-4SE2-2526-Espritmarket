package esprit_market.dto.carpooling;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Driver Profile Request DTO
 * Used for POST /api/driver-profiles endpoint
 * Transfers driver registration and license info from frontend to backend
 * 
 * Frontend -> Backend: Register as a driver with license verification
 * All fields are validated before processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfileRequestDTO {

    /** Driver's license number (5-25 alphanumeric chars, hyphens allowed) */
    @NotBlank(message = "License number is required")
    @Pattern(regexp = "^[A-Za-z0-9-]{5,25}$", message = "Invalid license number format")
    private String licenseNumber;

    /** Base64-encoded or URL to license document image for KYC verification */
    @NotBlank(message = "License document is required")
    private String licenseDocument;
}
