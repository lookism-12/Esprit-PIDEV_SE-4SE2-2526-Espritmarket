package esprit_market.dto.carpooling;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Ride Search Request DTO
 * Used for GET /api/rides/search endpoint
 * Transfers search criteria from frontend to backend for ride discovery
 * 
 * Frontend -> Backend: Search for available rides matching criteria
 * All fields are validated before processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideSearchRequestDTO {

    /** Starting location (optional) */
    private String departureLocation;

    /** Ending location (optional) */
    private String destinationLocation;

    /** Preferred departure date/time (optional) */
    private LocalDateTime departureTime;

    /** Number of seats needed (optional, minimum 1 if provided) */
    @Min(value = 1, message = "At least 1 seat is required")
    private Integer requestedSeats;
}
