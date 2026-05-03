package esprit_market.entity.gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Reward entity for Wheel of Fortune gamification
 */
@Document(collection = "rewards")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reward {
    
    @Id
    private ObjectId id;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    /**
     * Display label on the wheel (e.g., "10% OFF", "Free Shipping", "50 Points")
     */
    private String label;
    
    /**
     * Reward type: DISCOUNT, FREE_SHIPPING, POINTS, COUPON, NO_LUCK
     */
    private RewardType type;
    
    /**
     * Numeric value of the reward
     * - For DISCOUNT: percentage (e.g., 10 = 10%)
     * - For POINTS: number of points
     * - For FREE_SHIPPING: 0
     * - For NO_LUCK: 0
     */
    private Double value;
    
    /**
     * Probability weight (higher = more likely to win)
     * Example: If rewards have weights [50, 30, 15, 5], 
     * the first reward has 50% chance
     */
    private Integer probability;
    
    /**
     * Whether this reward is currently active
     */
    @Builder.Default
    private Boolean active = true;
    
    /**
     * Color for the wheel segment (hex code)
     */
    private String color;
    
    /**
     * Icon/emoji for visual representation
     */
    private String icon;
    
    /**
     * Description shown in the reward popup
     */
    private String description;
    
    /**
     * Coupon code generated (if type is COUPON)
     */
    private String couponCode;
    
    /**
     * Minimum order value to use this reward (optional)
     */
    private Double minOrderValue;
    
    /**
     * Expiry days from win date (0 = no expiry)
     */
    @Builder.Default
    private Integer expiryDays = 30;
    
    /**
     * User segment targeting: NEW, RETURNING, VIP, ALL
     */
    @Builder.Default
    private UserSegment targetSegment = UserSegment.ALL;
}
