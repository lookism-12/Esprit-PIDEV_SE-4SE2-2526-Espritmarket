package esprit_market.dto.cartDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

/**
 * DTO for Loyalty Configuration
 * Used for API requests/responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyConfigDTO {
    
    private String id;
    
    // ==================== BASE CALCULATION ====================
    
    @NotNull(message = "Base rate is required")
    @DecimalMin(value = "0.5", message = "Base rate must be at least 0.5 (50% conversion)")
    @DecimalMax(value = "2.0", message = "Base rate must not exceed 2.0 (200% conversion)")
    private Double baseRate;
    
    // ==================== USAGE LIMITS ====================
    
    @Min(value = 100, message = "Max points per order must be at least 100")
    @Max(value = 2000, message = "Max points per order must not exceed 2000")
    private Integer maxPointsPerOrder;
    
    @NotNull(message = "Points to currency rate is required")
    @DecimalMin(value = "0.05", message = "Points to currency rate must be at least 0.05")
    @DecimalMax(value = "0.2", message = "Points to currency rate must not exceed 0.2")
    private Double pointsToCurrencyRate;
    
    // ==================== LEVEL THRESHOLDS ====================
    
    @NotNull(message = "Silver threshold is required")
    @Min(value = 500, message = "Silver threshold must be at least 500")
    private Integer silverThreshold;
    
    @NotNull(message = "Gold threshold is required")
    @Min(value = 2000, message = "Gold threshold must be at least 2000")
    private Integer goldThreshold;
    
    @NotNull(message = "Platinum threshold is required")
    @Min(value = 8000, message = "Platinum threshold must be at least 8000")
    private Integer platinumThreshold;
    
    // ==================== TIER MULTIPLIERS ====================
    
    @NotNull(message = "Bronze multiplier is required")
    @DecimalMin(value = "1.0", message = "Bronze multiplier must be at least 1.0")
    @DecimalMax(value = "2.0", message = "Bronze multiplier must not exceed 2.0")
    private Double bronzeMultiplier;
    
    @NotNull(message = "Silver multiplier is required")
    @DecimalMin(value = "1.0", message = "Silver multiplier must be at least 1.0")
    @DecimalMax(value = "2.0", message = "Silver multiplier must not exceed 2.0")
    private Double silverMultiplier;
    
    @NotNull(message = "Gold multiplier is required")
    @DecimalMin(value = "1.0", message = "Gold multiplier must be at least 1.0")
    @DecimalMax(value = "2.5", message = "Gold multiplier must not exceed 2.5")
    private Double goldMultiplier;
    
    @NotNull(message = "Platinum multiplier is required")
    @DecimalMin(value = "1.0", message = "Platinum multiplier must be at least 1.0")
    @DecimalMax(value = "2.5", message = "Platinum multiplier must not exceed 2.5")
    private Double platinumMultiplier;
    
    // ==================== BONUS POINTS ====================
    
    @NotNull(message = "Bonus quantity is required")
    @Min(value = 0, message = "Bonus quantity must be at least 0")
    @Max(value = 200, message = "Bonus quantity must not exceed 200")
    private Integer bonusQuantity;
    
    @NotNull(message = "Bonus quantity threshold is required")
    @Min(value = 1, message = "Bonus quantity threshold must be at least 1")
    private Integer bonusQuantityThreshold;
    
    @NotNull(message = "Bonus high order is required")
    @Min(value = 0, message = "Bonus high order must be at least 0")
    @Max(value = 300, message = "Bonus high order must not exceed 300")
    private Integer bonusHighOrder;
    
    @NotNull(message = "Bonus high order threshold is required")
    @DecimalMin(value = "100.0", message = "Bonus high order threshold must be at least 100")
    private Double bonusHighOrderThreshold;
    
    // ==================== METADATA ====================
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private Boolean active;
}
