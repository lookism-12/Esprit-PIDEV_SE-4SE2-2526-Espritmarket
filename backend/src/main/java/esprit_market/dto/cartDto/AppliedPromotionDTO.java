package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.EventPromotionType;
import lombok.*;

/**
 * Applied Promotion DTO
 * 
 * Represents a promotion that was applied to an order during checkout.
 * Used to communicate which promotion gave the best discount.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppliedPromotionDTO {
    
    /**
     * Type of promotion applied
     * ORDER_BASED, HOLIDAY, BIRTHDAY
     */
    private String promotionType;
    
    /**
     * Discount amount applied
     */
    private Double discountAmount;
    
    /**
     * Discount percentage (if applicable)
     */
    private Double discountPercentage;
    
    /**
     * Human-readable description of the promotion
     * e.g., "Holiday Discount Applied (-15%)"
     * e.g., "Birthday Special (-20%)"
     * e.g., "Order Discount: Cart total ≥ 200 TND (-20%)"
     */
    private String description;
    
    /**
     * Rule or promotion ID (if applicable)
     */
    private String promotionId;
    
    /**
     * Rule or promotion name (if applicable)
     */
    private String promotionName;
}
