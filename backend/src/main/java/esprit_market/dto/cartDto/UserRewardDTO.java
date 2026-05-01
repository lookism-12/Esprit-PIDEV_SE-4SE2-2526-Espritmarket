package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.RewardStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for UserReward
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRewardDTO {
    
    private String id;
    private String userId;
    private String rewardId;
    
    private String rewardName;
    private Double rewardValue;
    private Double maxDiscountAmount;
    private Double minOrderAmount;
    
    private Integer pointsSpent;
    private RewardStatus status;
    private String couponCode;
    
    private List<String> allowedShopIds;
    private List<ShopSummaryDTO> allowedShops; // For display
    
    private LocalDateTime expiresAt;
    private LocalDateTime usedAt;
    private String usedInOrderId;
    private Double actualDiscountApplied;
    
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;
    
    // Computed fields
    private Boolean isExpired;
    private Boolean canUse;
    private Long daysUntilExpiry;
}
