package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.DiscountType;
import lombok.*;

import java.time.LocalDate;

/**
 * Response DTO for coupon data returned to clients.
 * Includes all fields including server-managed fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponResponse {
    
    private String id;
    
    private String code;
    
    private DiscountType discountType;
    
    private Double discountValue;
    
    private LocalDate expirationDate;
    
    private Boolean active;
    
    private Double minCartAmount;
    
    private Integer usageLimit;
    
    private Integer usageCount;
    
    private String eligibleUserLevel;
    
    private String userId;
    
    private Boolean combinableWithDiscount;
    
    private String description;
    
    // Computed fields for client convenience
    private Boolean isExpired;
    
    private Boolean isUsageLimitReached;
    
    private Integer remainingUsages;
}
