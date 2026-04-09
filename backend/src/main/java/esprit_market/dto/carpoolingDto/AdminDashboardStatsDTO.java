package esprit_market.dto.carpooling;

import lombok.*;

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
}
