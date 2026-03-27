package esprit_market.dto.cart;

import lombok.*;
import jakarta.validation.constraints.NotBlank;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyCouponRequest {
    @NotBlank(message = "Coupon code is required")
    private String couponCode;
}
