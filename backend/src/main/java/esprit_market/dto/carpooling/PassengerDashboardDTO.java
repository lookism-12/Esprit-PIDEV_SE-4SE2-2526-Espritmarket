package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerDashboardDTO {
    private String passengerName;
    private Float averageRating;
    private Integer totalRidesCompleted;
    private Float totalSpent;
    private Integer pendingRequests;
    private Integer activeBookings;
    private List<BookingResponseDTO> recentBookings;
    private List<RideRequestResponseDTO> myRideRequests;
}
