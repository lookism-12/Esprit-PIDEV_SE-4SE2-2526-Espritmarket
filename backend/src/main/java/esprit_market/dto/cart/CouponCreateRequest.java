package esprit_market.dto.cart;

import esprit_market.Enum.cartEnum.DiscountType;
import lombok.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Future;

import java.time.LocalDate;

/**
 * Request DTO for creating a new coupon.
 * Does not include server-managed fields like id, usageCount.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponCreateRequest {
    
    @NotBlank(message = "Coupon code is required")
    private String code;
    
    @NotNull(message = "Discount type is required")
    private DiscountType discountType;
    
    @NotNull(message = "Discount value is required")
    @Positive(message = "Discount value must be positive")
    private Double discountValue;
    
    @Future(message = "Expiration date must be in the future")
    private LocalDate expirationDate;
    
    private Double minCartAmount;
    
    private Integer usageLimit;
    
    private String eligibleUserLevel;
    
    private String userId;
    
    private Boolean combinableWithDiscount;
    
    private String description;
}
