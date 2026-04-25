package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.DiscountType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderCouponRequest {
    
    @NotBlank(message = "Coupon code is required")
    @Size(min = 3, max = 20, message = "Coupon code must be between 3 and 20 characters")
    @Pattern(regexp = "^[A-Z0-9]+$", message = "Coupon code must contain only uppercase letters and numbers")
    private String code;
    
    @NotNull(message = "Discount type is required")
    private DiscountType discountType;
    
    @NotNull(message = "Discount value is required")
    @Positive(message = "Discount value must be positive")
    @Max(value = 100, message = "Percentage discount cannot exceed 100")
    private Double discountValue;
    
    @PositiveOrZero(message = "Minimum order amount must be zero or positive")
    private Double minimumOrderAmount;
    
    @PositiveOrZero(message = "Maximum discount must be zero or positive")
    private Double maximumDiscount;
    
    @Positive(message = "Usage limit must be positive")
    private Integer usageLimit;
    
    @NotNull(message = "Valid from date is required")
    private LocalDate validFrom;
    
    @NotNull(message = "Valid until date is required")
    private LocalDate validUntil;
    
    @NotNull(message = "Active status is required")
    private Boolean isActive;
}
