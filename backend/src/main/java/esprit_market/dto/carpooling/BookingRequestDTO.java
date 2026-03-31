package esprit_market.dto.carpooling;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Booking Request DTO
 * Used for POST /api/bookings?rideId=<id> endpoint
 * Transfers seat reservation data from frontend to backend
 * 
 * Frontend -> Backend: Create new booking for a passenger
 * All fields are validated before processing
 * 
 * NOTE: rideId is passed as query parameter, not in request body
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDTO {

    /** Ride ID (passed as query param ?rideId=...) */
    @NotBlank(message = "Ride ID is required")
    private String rideId;

    /** Number of seats to reserve (1-7) */
    @NotNull
    @Min(value = 1, message = "At least 1 seat must be requested")
    private Integer numberOfSeats;

    /** Passenger pickup location (required) */
    @NotBlank(message = "Pickup location is required")
    private String pickupLocation;

    /** Passenger dropoff location (required) */
    @NotBlank(message = "Dropoff location is required")
    private String dropoffLocation;
}
