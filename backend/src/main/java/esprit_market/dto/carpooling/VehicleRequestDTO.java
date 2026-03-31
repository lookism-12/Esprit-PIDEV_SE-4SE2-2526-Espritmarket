package esprit_market.dto.carpooling;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Vehicle Request DTO
 * Used for POST /api/vehicles endpoint
 * Transfers vehicle registration data from frontend to backend
 * 
 * Frontend -> Backend: Register a new vehicle
 * All fields are validated before processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRequestDTO {

    /** Vehicle brand (e.g., "Toyota", "BMW") */
    @NotBlank(message = "Make is required")
    private String make;

    /** Vehicle model (e.g., "Corolla", "X5") */
    @NotBlank(message = "Model is required")
    private String model;

    /**
     * Vehicle registration plate/number (2-15 chars, uppercase + numbers + dash)
     */
    @NotBlank(message = "License plate is required")
    @Pattern(regexp = "^[a-zA-Z0-9-]{2,15}$", message = "Invalid license plate format")
    private String licensePlate;

    /** Total seat capacity (1-7 seats) */
    @NotNull
    @Min(value = 1, message = "At least 1 seat required")
    @Max(value = 7, message = "Maximum 7 seats allowed")
    private Integer numberOfSeats;
}
