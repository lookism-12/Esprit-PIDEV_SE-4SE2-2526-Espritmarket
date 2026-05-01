package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.RewardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * LoyaltyReward represents a convertible reward tier.
 * Users convert accumulated points into these rewards.
 * 
 * Example:
 * - 1000 points → 5% discount coupon
 * - 5000 points → 10% discount coupon
 * - 10000 points → 15% discount coupon
 */
@Document(collection = "loyalty_rewards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyReward {
    
    @Id
    private ObjectId id;
    
    /**
     * Name of the reward (e.g., "Bronze Discount", "Silver Coupon")
     */
    private String name;
    
    /**
     * Description for display
     */
    private String description;
    
    /**
     * Points required to unlock this reward
     */
    private Integer pointsRequired;
    
    /**
     * Type of reward: PERCENTAGE_DISCOUNT or FIXED_AMOUNT
     */
    private RewardType rewardType;
    
    /**
     * Discount value
     * - For PERCENTAGE_DISCOUNT: 5, 10, 15 (means 5%, 10%, 15%)
     * - For FIXED_AMOUNT: 10, 20, 50 (means 10 TND, 20 TND, 50 TND)
     */
    private Double rewardValue;
    
    /**
     * Maximum discount amount (prevents abuse)
     * Example: 15% discount capped at 50 TND
     */
    private Double maxDiscountAmount;
    
    /**
     * Minimum order amount to use this reward
     */
    private Double minOrderAmount;
    
    /**
     * Validity period in days after conversion
     */
    private Integer validityDays;
    
    /**
     * Whether this reward is currently active
     */
    @Builder.Default
    private Boolean active = true;
    
    /**
     * Display order (for sorting in UI)
     */
    private Integer displayOrder;
    
    /**
     * Metadata
     */
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
}
