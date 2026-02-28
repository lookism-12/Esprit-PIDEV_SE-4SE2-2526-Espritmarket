package esprit_market.dto;

import esprit_market.Enum.cartEnum.DiscountType;
import lombok.*;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for updating an existing discount.
 * All fields are optional for partial updates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountUpdateRequest {
    
    private String name;
    
    private String description;
    
    private DiscountType discountType;
    
    @Positive(message = "Discount value must be positive")
    private Double discountValue;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private Boolean active;
    
    private Double minCartAmount;
    
    private Boolean autoActivate;
    
    private List<String> categoryIds;
}
