package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.Enum.cartEnum.RuleTriggerType;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Automatic Discount Rule Entity
 * 
 * Allows providers to configure automatic discount rules for their shop.
 * Rules are applied automatically during checkout without requiring coupon codes.
 * 
 * Examples:
 * - Cart total > 200 TND → 20% discount
 * - Quantity >= 3 items → 15% discount
 * - Grouped products → Special offer
 */
@Document(collection = "auto_discount_rules")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoDiscountRule {
    
    @Id
    private ObjectId id;
    
    @Indexed
    private ObjectId providerId;
    
    @Indexed
    private ObjectId shopId;
    
    private String ruleName;
    
    /**
     * Type of trigger that activates this rule
     * CART_TOTAL_THRESHOLD, QUANTITY_THRESHOLD, GROUPED_PRODUCT_OFFER
     */
    private RuleTriggerType triggerType;
    
    /**
     * Threshold value for the trigger
     * - For CART_TOTAL_THRESHOLD: minimum cart amount (e.g., 200.0)
     * - For QUANTITY_THRESHOLD: minimum quantity (e.g., 3.0)
     * - For GROUPED_PRODUCT_OFFER: number of products required (e.g., 2.0)
     */
    private Double thresholdValue;
    
    /**
     * Type of discount to apply
     * PERCENTAGE or FIXED
     */
    private DiscountType discountType;
    
    /**
     * Discount value
     * - For PERCENTAGE: percentage value (e.g., 20.0 for 20%)
     * - For FIXED: fixed amount (e.g., 50.0 for 50 TND)
     */
    private Double discountValue;
    
    /**
     * Maximum discount amount (optional, for percentage discounts)
     */
    private Double maximumDiscount;
    
    /**
     * Priority for rule application (higher priority applied first)
     * Default: 0
     */
    @Builder.Default
    private Integer priority = 0;
    
    /**
     * Rule active status
     */
    @Builder.Default
    private Boolean active = true;
    
    /**
     * Start date for rule validity (optional)
     */
    private LocalDate validFrom;
    
    /**
     * End date for rule validity (optional)
     */
    private LocalDate validUntil;
    
    /**
     * Description of the rule (optional)
     */
    private String description;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    /**
     * Check if rule is currently valid based on dates
     */
    public boolean isValidNow() {
        LocalDate today = LocalDate.now();
        
        if (validFrom != null && today.isBefore(validFrom)) {
            return false;
        }
        
        if (validUntil != null && today.isAfter(validUntil)) {
            return false;
        }
        
        return Boolean.TRUE.equals(active);
    }
}
