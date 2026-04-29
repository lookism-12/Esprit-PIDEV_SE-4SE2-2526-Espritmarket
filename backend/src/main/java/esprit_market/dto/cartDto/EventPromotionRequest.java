package esprit_market.dto.cartDto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Event Promotion Configuration Request DTO
 * 
 * Used by providers to configure their event-based promotions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventPromotionRequest {
    
    // ==================== HOLIDAY PROMOTION ====================
    
    @NotNull(message = "Holiday enabled status is required")
    private Boolean holidayEnabled;
    
    @Min(value = 0, message = "Holiday discount percentage must be at least 0")
    @Max(value = 100, message = "Holiday discount percentage cannot exceed 100")
    private Double holidayDiscountPercentage;
    
    @Min(value = 0, message = "Holiday minimum order amount must be at least 0")
    private Double holidayMinOrderAmount;
    
    @Min(value = 0, message = "Holiday maximum discount must be at least 0")
    private Double holidayMaxDiscount;
    
    // ==================== BIRTHDAY PROMOTION ====================
    
    @NotNull(message = "Birthday enabled status is required")
    private Boolean birthdayEnabled;
    
    @Min(value = 0, message = "Birthday discount percentage must be at least 0")
    @Max(value = 100, message = "Birthday discount percentage cannot exceed 100")
    private Double birthdayDiscountPercentage;
    
    @Min(value = 0, message = "Birthday minimum order amount must be at least 0")
    private Double birthdayMinOrderAmount;
    
    @Min(value = 0, message = "Birthday maximum discount must be at least 0")
    private Double birthdayMaxDiscount;
}
