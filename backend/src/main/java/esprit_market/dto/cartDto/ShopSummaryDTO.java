package esprit_market.dto.cartDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary of a shop for loyalty display
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopSummaryDTO {
    
    private String shopId;
    private String shopName;
    private Integer orderCount;
    private Double totalSpent;
}
