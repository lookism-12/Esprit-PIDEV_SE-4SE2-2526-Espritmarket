package esprit_market.dto.carpooling;

import esprit_market.Enum.carpoolingEnum.RideStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideResponseDTO {

    private String rideId;
    private String driverProfileId;
    private String driverName;
    private String vehicleId;
    private String vehicleMake;
    private String vehicleModel;
    private String departureLocation;
    private String destinationLocation;
    private LocalDateTime departureTime;
    private Integer availableSeats;
    private Float pricePerSeat;
    private RideStatus status;
    private LocalDateTime completedAt;
}
