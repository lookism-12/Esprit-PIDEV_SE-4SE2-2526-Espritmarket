package esprit_market.dto.carpooling;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Ride Request DTO
 * Used for POST /api/rides endpoint
 * Transfers new ride creation data from frontend to backend
 * 
 * Frontend -> Backend: Create new ride offer
 * All fields are validated before processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideRequestDTO {

    /** Vehicle ID to use for this ride (required) */
    @NotBlank(message = "Vehicle ID is required")
    private String vehicleId;

    /** Starting location (required) */
    @NotBlank(message = "Departure location is required")
    private String departureLocation;

    /** Ending location (required) */
    @NotBlank(message = "Destination location is required")
    private String destinationLocation;

    /** When the ride starts (required, must be future date) */
    @NotNull(message = "Departure time is required")
    @FutureOrPresent(message = "Departure time must be in the future or present")
    private LocalDateTime departureTime;

    /** Initial available seats (required, 1-7) */
    @NotNull
    @Min(value = 1, message = "At least 1 seat must be available")
    private Integer availableSeats;

    /** Price per seat in TND (required, non-negative) */
    @NotNull
    @Min(value = 0, message = "Price per seat cannot be negative")
    private Float pricePerSeat;

    /** Estimated trip duration in minutes (required, minimum 1) */
    @NotNull(message = "Estimated duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer estimatedDurationMinutes;
}
