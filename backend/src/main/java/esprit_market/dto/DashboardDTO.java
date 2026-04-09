package esprit_market.dto;

import esprit_market.dto.carpooling.*;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    private Integer completedRides;
    private Float averageRating;
    private Double earningsThisMonth;
    private Integer activeRides;
    private Double totalEarnings;
    private Double totalBalance;
    private List<DashboardRideResponseDTO> scheduledRides;
    private List<DashboardBookingResponseDTO> pendingBookings;
    private DashboardVehicleResponseDTO currentVehicle;
    private List<ActivityDTO> recentActivities;
    private List<Double> earningsHistory;
    private List<String> earningsLabels;
    private List<ReviewResponseDTO> recentReviews;
    private String driverName;
    private Boolean isVerified;
}
