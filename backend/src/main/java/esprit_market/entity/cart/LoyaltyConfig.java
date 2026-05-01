package esprit_market.entity.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Dynamic Loyalty Configuration stored in MongoDB
 * Allows runtime configuration without redeployment
 */
@Document(collection = "loyalty_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyConfig {
    
    @Id
    private ObjectId id;
    
    // ==================== BASE CALCULATION ====================
    
    /**
     * Base points rate (points per 1 TND spent)
     * Default: 1.0 (1:1 ratio - 1 TND = 1 point)
     * Valid range: 0.5 - 2.0 (configurable by admin)
     * 
     * Examples:
     * - 0.5 = Conservative (100 TND = 50 points)
     * - 1.0 = Balanced (100 TND = 100 points) ✅ RECOMMENDED
     * - 2.0 = Generous (100 TND = 200 points)
     */
    private Double baseRate;
    
    // ==================== USAGE LIMITS ====================
    
    /**
     * Maximum points that can be used per order (prevents abuse)
     * Default: 500 points (≈ 50 TND discount if 1 point = 0.1 TND)
     * Set to null for unlimited usage
     */
    private Integer maxPointsPerOrder;
    
    /**
     * Points to currency conversion rate for discounts
     * Default: 0.1 (10 points = 1 TND discount)
     * Valid range: 0.05 - 0.2
     */
    private Double pointsToCurrencyRate;
    
    // ==================== LEVEL THRESHOLDS ====================
    
    /**
     * Points required for SILVER level
     * Default: 1000 points (≈ 1000 TND spent)
     */
    private Integer silverThreshold;
    
    /**
     * Points required for GOLD level  
     * Default: 5000 points (≈ 5000 TND spent)
     */
    private Integer goldThreshold;
    
    /**
     * Points required for PLATINUM level
     * Default: 15000 points (≈ 15000 TND spent)
     */
    private Integer platinumThreshold;
    
    // ==================== TIER MULTIPLIERS ====================
    
    /**
     * BRONZE tier multiplier
     * Default: 1.0
     */
    private Double bronzeMultiplier;
    
    /**
     * SILVER tier multiplier
     * Default: 1.2 (+20% bonus)
     */
    private Double silverMultiplier;
    
    /**
     * GOLD tier multiplier
     * Default: 1.5 (+50% bonus)
     */
    private Double goldMultiplier;
    
    /**
     * PLATINUM tier multiplier
     * Default: 2.0 (+100% bonus)
     */
    private Double platinumMultiplier;
    
    // ==================== BONUS POINTS ====================
    
    /**
     * Bonus points for quantity threshold (5+ items)
     * Default: 50 points
     */
    private Integer bonusQuantity;
    
    /**
     * Quantity threshold to trigger bonus
     * Default: 5 items
     */
    private Integer bonusQuantityThreshold;
    
    /**
     * Bonus points for high-value orders (200+ TND)
     * Default: 100 points
     */
    private Integer bonusHighOrder;
    
    /**
     * Order amount threshold for high-value bonus
     * Default: 200.0 TND
     */
    private Double bonusHighOrderThreshold;
    
    // ==================== METADATA ====================
    
    /**
     * When this configuration was created
     */
    private LocalDateTime createdAt;
    
    /**
     * When this configuration was last updated
     */
    private LocalDateTime updatedAt;
    
    /**
     * Admin user who last updated this config
     */
    private String updatedBy;
    
    /**
     * Whether this configuration is active
     * Only one config should be active at a time
     */
    @Builder.Default
    private Boolean active = true;
}
