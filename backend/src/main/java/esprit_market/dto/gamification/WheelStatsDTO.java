package esprit_market.dto.gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WheelStatsDTO {
    private Long totalSpins;
    private Long totalSpinsToday;
    private Long uniqueUsers;
    private Map<String, Long> rewardDistribution; // rewardLabel -> count
    private Double conversionRate; // Percentage of users who made purchase after spin
}
