package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverStatsDTO {

    private Integer totalRidesCreated;
    private Integer totalRidesCompleted;
    private Float totalEarnings;
    private Float monthlyEarnings;
    private Integer pendingRequests;
    private Float acceptanceRate;
    private Float averageRating;
    private Float driverScore;
    private String badge;
    private java.util.List<MonthlyEarningDTO> monthlyEarningsTrend;
}
