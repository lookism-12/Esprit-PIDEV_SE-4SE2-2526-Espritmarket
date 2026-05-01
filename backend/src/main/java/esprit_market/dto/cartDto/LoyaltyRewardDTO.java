package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.RewardType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for LoyaltyReward
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyRewardDTO {
    
    private String id;
    
    @NotBlank(message = "Reward name is required")
    @Size(min = 3, max = 100, message = "Reward name must be between 3 and 100 characters")
    private String name;
    
    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    @NotNull(message = "Points required is mandatory")
    @Min(value = 100, message = "Points required must be at least 100")
    @Max(value = 100000, message = "Points required must not exceed 100000")
    private Integer pointsRequired;
    
    @NotNull(message = "Reward type is required")
    private RewardType rewardType;
    
    @NotNull(message = "Reward value is required")
    @DecimalMin(value = "0.1", message = "Reward value must be at least 0.1")
    @DecimalMax(value = "100.0", message = "Reward value must not exceed 100")
    private Double rewardValue;
    
    @DecimalMin(value = "1.0", message = "Max discount amount must be at least 1")
    private Double maxDiscountAmount;
    
    @DecimalMin(value = "0.0", message = "Min order amount must be at least 0")
    private Double minOrderAmount;
    
    @NotNull(message = "Validity days is required")
    @Min(value = 1, message = "Validity days must be at least 1")
    @Max(value = 365, message = "Validity days must not exceed 365")
    private Integer validityDays;
    
    private Boolean active;
    private Integer displayOrder;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
}
