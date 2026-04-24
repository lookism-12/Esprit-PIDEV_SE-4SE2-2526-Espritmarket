package esprit_market.dto.carpooling;

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
    // All fields optional — allows partial/combined filtering
    private String departureLocation;
    private String destinationLocation;
    private LocalDateTime departureTime;
    private Integer requestedSeats;
    private LocalDateTime postedSince;
}
