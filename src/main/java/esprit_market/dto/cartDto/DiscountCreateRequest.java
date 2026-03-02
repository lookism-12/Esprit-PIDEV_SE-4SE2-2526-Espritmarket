package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.DiscountType;
import lombok.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a new discount.
 * Does not include server-managed fields like id.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountCreateRequest {
    
    @NotBlank(message = "Discount name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Discount type is required")
    private DiscountType discountType;
    
    @NotNull(message = "Discount value is required")
    @Positive(message = "Discount value must be positive")
    private Double discountValue;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private Double minCartAmount;
    
    private Boolean autoActivate;
    
    private List<String> categoryIds;
}
