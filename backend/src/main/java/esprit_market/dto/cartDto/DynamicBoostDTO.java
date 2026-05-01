package esprit_market.dto.cartDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for dynamic boost information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DynamicBoostDTO {
    
    private Double dynamicBoost;
    private Double effectiveBaseRate;
    private String boostTier;
}
