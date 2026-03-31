package esprit_market.dto.carpoolingDto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideRequestDTO {

    @NotBlank(message = "Vehicle ID is required")
    private String vehicleId;

    @NotBlank(message = "Departure location is required")
    private String departureLocation;

    @NotBlank(message = "Destination location is required")
    private String destinationLocation;

    @NotNull(message = "Departure time is required")
    @Future(message = "Departure time must be in the future")
    private LocalDateTime departureTime;

    @NotNull
    @Min(value = 1, message = "At least 1 seat must be available")
    private Integer availableSeats;

    @NotNull
    @Min(value = 0, message = "Price per seat cannot be negative")
    private Float pricePerSeat;
}
