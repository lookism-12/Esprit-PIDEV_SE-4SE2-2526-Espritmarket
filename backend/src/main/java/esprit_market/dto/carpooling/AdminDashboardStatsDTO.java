package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Global statistics for the Carpooling Admin Dashboard
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDTO {
    private long activeRidesCount;
    private long pendingRequestsCount;
    private long unverifiedDriversCount;
    private double totalRevenue;

    // Percentage growth compared to last month (hardcoded or calculated)
    private int activeRidesGrowth;
    private int pendingRequestsGrowth;
    private int unverifiedDriversGrowth;
    private int totalRevenueGrowth;
}
