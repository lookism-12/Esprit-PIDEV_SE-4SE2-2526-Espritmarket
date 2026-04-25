package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.Enum.cartEnum.RuleTriggerType;
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
public class AutoDiscountRuleRequest {
    
    @NotBlank(message = "Rule name is required")
    @Size(min = 3, max = 100, message = "Rule name must be between 3 and 100 characters")
    private String ruleName;
    
    @NotNull(message = "Trigger type is required")
    private RuleTriggerType triggerType;
    
    @NotNull(message = "Threshold value is required")
    @Positive(message = "Threshold value must be positive")
    private Double thresholdValue;
    
    @NotNull(message = "Discount type is required")
    private DiscountType discountType;
    
    @NotNull(message = "Discount value is required")
    @Positive(message = "Discount value must be positive")
    private Double discountValue;
    
    @PositiveOrZero(message = "Maximum discount must be zero or positive")
    private Double maximumDiscount;
    
    @Min(value = 0, message = "Priority must be zero or positive")
    @Max(value = 100, message = "Priority cannot exceed 100")
    private Integer priority;
    
    @NotNull(message = "Active status is required")
    private Boolean isActive;
    
    private LocalDate validFrom;
    
    private LocalDate validUntil;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
}
