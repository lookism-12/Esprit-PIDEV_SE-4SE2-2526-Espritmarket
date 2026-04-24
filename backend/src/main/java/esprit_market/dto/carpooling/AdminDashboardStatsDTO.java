package esprit_market.dto.carpooling;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDTO {
    private long activeRidesCount;
    private long pendingRequestsCount;
    private long unverifiedDriversCount;
    private double totalRevenue;
    
    private int activeRidesGrowth;
    private int pendingRequestsGrowth;
    private int unverifiedDriversGrowth;
    private int totalRevenueGrowth;

    // Trend & Growth
    private Map<String, Long> ridesTrend;       // Month -> Count
    private Map<String, Double> earningsTrend;  // Month -> Amount
    private Map<String, Long> userGrowth;      // Month -> New Users
    
    // Distribution
    private Map<String, Long> statusDistribution; // Status -> Count
    
    // Top Routes
    private List<RouteStatDTO> topRoutes;
    
    // Demand / Reservations per ride
    private Map<String, Double> reservationsDemand; // Day/Month -> Average reservations
}
