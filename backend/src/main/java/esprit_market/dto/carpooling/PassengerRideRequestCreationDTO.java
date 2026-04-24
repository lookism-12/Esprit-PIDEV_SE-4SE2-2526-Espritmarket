package esprit_market.dto.carpooling;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerRideRequestCreationDTO {
    @NotBlank(message = "Departure location is required")
    private String departureLocation;

    @NotBlank(message = "Destination location is required")
    private String destinationLocation;

    @NotNull(message = "Departure time is required")
    private LocalDateTime departureTime;

    @NotNull
    @Min(value = 1, message = "At least 1 seat required")
    private Integer requestedSeats;

    private Float proposedPrice;
}
