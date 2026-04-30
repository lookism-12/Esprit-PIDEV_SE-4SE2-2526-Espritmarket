package esprit_market.dto.carpooling;

import esprit_market.Enum.carpoolingEnum.RideRequestStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideRequestResponseDTO {
    private String id;
    private String passengerProfileId;
    private String passengerName;
    private String departureLocation;
    private String destinationLocation;
    private LocalDateTime departureTime;
    private Integer requestedSeats;
    private Float proposedPrice;
    private RideRequestStatus status;
    private String driverId;
    private String driverName;
    private String rideId;
    private Float counterPrice;
    private String counterPriceNote;

    // Actual user IDs (not profile IDs) — used by the frontend to open a chat
    private String passengerUserId;
    private String driverUserId;

    // AI Intelligence Fields
    private Double aiAcceptanceProbability;
    private java.util.List<String> aiExplanation;
}
