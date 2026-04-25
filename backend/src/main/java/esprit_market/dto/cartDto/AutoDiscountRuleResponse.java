package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.Enum.cartEnum.RuleTriggerType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoDiscountRuleResponse {
    
    private String id;
    private String providerId;
    private String shopId;
    private String ruleName;
    private RuleTriggerType triggerType;
    private Double thresholdValue;
    private DiscountType discountType;
    private Double discountValue;
    private Double maximumDiscount;
    private Integer priority;
    private Boolean isActive;
    private LocalDate validFrom;
    private LocalDate validUntil;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Computed field for frontend display
    private String triggerDescription;
    private String discountDescription;
    private Boolean isCurrentlyValid;
}
