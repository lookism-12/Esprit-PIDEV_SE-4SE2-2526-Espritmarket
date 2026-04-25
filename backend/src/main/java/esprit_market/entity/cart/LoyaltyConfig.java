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
     * Base points rate (percentage of order amount)
     * Default: 0.002 (0.2%)
     * Valid range: 0.001 - 0.01
     */
    private Double baseRate;
    
    // ==================== LEVEL THRESHOLDS ====================
    
    /**
     * Points required for SILVER level
     * Default: 5000
     */
    private Integer silverThreshold;
    
    /**
     * Points required for GOLD level
     * Default: 20000
     */
    private Integer goldThreshold;
    
    /**
     * Points required for PLATINUM level
     * Default: 50000
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
     * Default: 1.1
     */
    private Double silverMultiplier;
    
    /**
     * GOLD tier multiplier
     * Default: 1.25
     */
    private Double goldMultiplier;
    
    /**
     * PLATINUM tier multiplier
     * Default: 1.5
     */
    private Double platinumMultiplier;
    
    // ==================== BONUS POINTS ====================
    
    /**
     * Bonus points for quantity threshold (10+ items)
     * Default: 10
     */
    private Integer bonusQuantity;
    
    /**
     * Quantity threshold to trigger bonus
     * Default: 10
     */
    private Integer bonusQuantityThreshold;
    
    /**
     * Bonus points for high-value orders (>$500)
     * Default: 5
     */
    private Integer bonusHighOrder;
    
    /**
     * Order amount threshold for high-value bonus
     * Default: 500.0
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
