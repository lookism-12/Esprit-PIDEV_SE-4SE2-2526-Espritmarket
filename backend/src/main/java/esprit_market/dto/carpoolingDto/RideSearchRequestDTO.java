package esprit_market.dto.carpoolingDto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideSearchRequestDTO {

    @NotBlank(message = "Departure location is required")
    private String departureLocation;

    @NotBlank(message = "Destination location is required")
    private String destinationLocation;

    @NotNull(message = "Departure time is required")
    private LocalDateTime departureTime; // typically a future date for search

    @NotNull
    @Min(value = 1, message = "At least 1 seat is required")
    private Integer requestedSeats;
}
