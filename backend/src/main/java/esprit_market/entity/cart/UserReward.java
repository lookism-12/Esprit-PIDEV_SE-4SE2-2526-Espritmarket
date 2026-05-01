package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.RewardStatus;
import esprit_market.entity.user.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * UserReward represents a reward that a user has converted from points.
 * 
 * Lifecycle:
 * - ACTIVE: Available for use
 * - USED: Applied to an order
 * - EXPIRED: Validity period passed
 * - CANCELLED: Manually cancelled (points refunded)
 */
@Document(collection = "user_rewards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserReward {
    
    @Id
    private ObjectId id;
    
    @DBRef
    private User user;
    
    /**
     * Reference to the reward template
     */
    private ObjectId rewardId;
    
    /**
     * Snapshot of reward details (denormalized for history)
     */
    private String rewardName;
    private Double rewardValue;
    private Double maxDiscountAmount;
    private Double minOrderAmount;
    
    /**
     * Points spent to get this reward
     */
    private Integer pointsSpent;
    
    /**
     * Status of this reward
     */
    @Builder.Default
    private RewardStatus status = RewardStatus.ACTIVE;
    
    /**
     * Unique coupon code generated for this reward
     */
    private String couponCode;
    
    /**
     * Shops where this reward can be used (top 3 shops)
     * Empty list = can be used anywhere
     */
    private List<ObjectId> allowedShopIds;
    
    /**
     * Validity period
     */
    private LocalDateTime expiresAt;
    
    /**
     * Usage tracking
     */
    private LocalDateTime usedAt;
    private ObjectId usedInOrderId;
    private Double actualDiscountApplied;
    
    /**
     * Metadata
     */
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;
}
