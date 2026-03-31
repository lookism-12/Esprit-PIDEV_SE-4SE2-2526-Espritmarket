package esprit_market.dto.marketplace;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopRequestDTO {
    private String ownerId;
    private String name;
    private String description;
}
