package esprit_market.dto.marketplace;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopResponseDTO {
    private String id;
    private String ownerId;
    private String name;
    private String description;
    private String address;
    private String phone;
    private String email;
    private String logo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // ✅ Social media links
    @Builder.Default
    private Map<String, String> socialLinks = new HashMap<>();
    
    // ✅ Shop status and settings
    private boolean isActive;
    
    // ✅ Owner information (populated by service)
    private String ownerName;
    private String ownerEmail;
    
    // ✅ Shop statistics (calculated by service)
    private int productCount;
    private int approvedProductCount;
    private double averageRating;
    private int totalReviews;
    
    // ========================================
    // TRUST & REPUTATION SYSTEM FIELDS
    // ========================================
    
    /**
     * Shop trust score (0-100)
     */
    private double trustScore;
    
    /**
     * Trust badge level
     * Values: NEW_SELLER, GROWING_SELLER, TRUSTED_SELLER, TOP_SELLER
     */
    private String trustBadge;
}
