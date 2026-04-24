package esprit_market.dto.carpooling;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardRideResponseDTO {
    private String rideId;
    private String departureLocation;
    private String destinationLocation;
    private String departureTime;
    private Integer availableSeats;
    private Double pricePerSeat;
    private String status;
}
