package esprit_market.dto;

import esprit_market.Enum.cartEnum.DiscountType;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO for discount data returned to clients.
 * Includes all fields including server-managed fields.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountResponse {
    
    private String id;
    
    private String name;
    
    private String description;
    
    private DiscountType discountType;
    
    private Double discountValue;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private Boolean active;
    
    private Double minCartAmount;
    
    private Boolean autoActivate;
    
    private List<String> categoryIds;
    
    // Computed fields for client convenience
    private Boolean isCurrentlyActive;
    
    private Boolean isExpired;
    
    private Integer daysUntilExpiration;
}
