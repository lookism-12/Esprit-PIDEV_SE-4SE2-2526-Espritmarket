package esprit_market.dto;

import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.Ride;
import esprit_market.entity.carpooling.Vehicle;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDTO {
    // Driver stats
    private Integer completedRides;
    private Float averageRating;
    private Double earningsThisMonth;
    private Integer activeRides;
    private Double totalEarnings;

    // Scheduled rides (upcoming/in-progress)
    private List<esprit_market.dto.carpooling.DashboardRideResponseDTO> scheduledRides;

    // Pending booking requests
    private List<esprit_market.dto.carpooling.DashboardBookingResponseDTO> pendingBookings;

    // Current vehicle
    private esprit_market.dto.carpooling.DashboardVehicleResponseDTO currentVehicle;

    // Recent activity
    private List<ActivityDTO> recentActivities;

    // Monthly earnings history (last 12 months)
    private List<Double> earningsHistory;
    private List<String> earningsLabels;

    // Driver info
    private String driverName;
    private String driverAvatar;
    private Boolean isVerified;
    private Double totalBalance;

    // Recent reviews
    private List<esprit_market.dto.carpooling.ReviewResponseDTO> recentReviews;
}
