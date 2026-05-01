package esprit_market.dto.cartDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Complete loyalty dashboard data for frontend
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyDashboardDTO {
    
    // User's loyalty card info
    private Integer totalPoints;
    private Integer totalPointsEarned;
    private String loyaltyLevel;
    private Double currentMultiplier;
    
    // Dynamic boost info
    private Integer ordersThisMonth;
    private Double dynamicBoost;
    private String boostTier;
    
    // Available rewards (can convert to)
    private List<LoyaltyRewardDTO> availableRewards;
    
    // User's active rewards
    private List<UserRewardDTO> activeRewards;
    
    // Top shops where rewards can be used
    private List<ShopSummaryDTO> topShops;
    
    // Points to next reward
    private Integer pointsToNextReward;
    private String nextRewardName;
}
