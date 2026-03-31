package esprit_market.dto.carpooling;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PassengerRideRequestCreationDTO {
    @NotBlank(message = "Departure location is required")
    private String departureLocation;

    @NotBlank(message = "Destination location is required")
    private String destinationLocation;

    @NotNull(message = "Departure time is required")
    @FutureOrPresent(message = "Departure time must be in the future")
    private LocalDateTime departureTime;

    @NotNull
    @Min(value = 1, message = "At least 1 seat is required")
    @Max(value = 7, message = "Maximum 7 seats allowed")
    private Integer requestedSeats;

    @Min(value = 0, message = "Proposed price cannot be negative")
    private Float proposedPrice;
}
