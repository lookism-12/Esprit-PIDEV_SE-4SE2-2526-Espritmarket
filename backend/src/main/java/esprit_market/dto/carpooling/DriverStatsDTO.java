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

    private Integer totalRidesCompleted;
    /** Completed rides in the last 30 days (rolling window) */
    private Integer recentRidesCompleted;
    private Float averageRating;
    private Float totalEarnings;
    /** Current number of live passenger requests (PENDING) */
    private Long directRequestsCount;
}
