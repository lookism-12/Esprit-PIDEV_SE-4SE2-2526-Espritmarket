package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.DiscountType;
import lombok.*;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

/**
 * Request DTO for updating an existing coupon.
 * All fields are optional for partial updates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponUpdateRequest {
    
    private String code;
    
    private DiscountType discountType;
    
    @Positive(message = "Discount value must be positive")
    private Double discountValue;
    
    private LocalDate expirationDate;
    
    private Boolean active;
    
    private Double minCartAmount;
    
    private Integer usageLimit;
    
    private String eligibleUserLevel;
    
    private Boolean combinableWithDiscount;
    
    private String description;
}
