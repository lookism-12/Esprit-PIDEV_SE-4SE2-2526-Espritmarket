package esprit_market.dto.carpooling;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDTO {

    @NotBlank(message = "Ride ID is required")
    private String rideId;

    @NotNull
    @Min(value = 1, message = "At least 1 seat must be requested")
    private Integer numberOfSeats;

    @NotBlank(message = "Pickup location is required")
    private String pickupLocation;

    @NotBlank(message = "Dropoff location is required")
    private String dropoffLocation;
}
