package esprit_market.dto.marketplace;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

import esprit_market.Enum.marketplaceEnum.ProductStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponseDTO {
    private String id;
    private String name;
    private String description;
    private String shopId;
    private String shopName; // ✅ Shop name for display
    private String shopLogo; // ✅ Shop logo for display
    private String sellerName; // ✅ Added missing sellerName field
    @Builder.Default
    private List<String> categoryIds = new ArrayList<>();
    private double price;
    private int stock;
    @Builder.Default
    private List<ProductImageDTO> images = new ArrayList<>();
    private ProductStatus status;
    
    // ✅ Added missing fields used in ProductMapper
    private String stockStatus;
    private boolean isAvailable;
    
    // ✅ Added approval workflow fields
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime approvedAt;
    private String approvedBy;
    private String rejectionReason;
}
