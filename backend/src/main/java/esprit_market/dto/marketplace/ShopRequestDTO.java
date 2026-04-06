package esprit_market.dto.marketplace;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.Map;
import java.util.HashMap;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopRequestDTO {
    private String ownerId;
    private String name;
    private String description;
    private String address;
    private String phone;
    private String email;
    private String logo;
    
    // ✅ Social media links
    @Builder.Default
    private Map<String, String> socialLinks = new HashMap<>();
    
    // ✅ Shop settings
    private Boolean isActive;
}
