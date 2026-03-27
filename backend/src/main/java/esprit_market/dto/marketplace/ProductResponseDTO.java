package esprit_market.dto.marketplace;

import esprit_market.Enum.marketplaceEnum.ProductCondition;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponseDTO {
    private String id;
    private String name;
    private String description;
    private String shopId;
    @Builder.Default
    private List<String> categoryIds = new ArrayList<>();
    private double price;
    private Double originalPrice;
    private int stock;
    
    private Double rating;
    private Integer reviewsCount;
    private ProductCondition condition;
    private boolean isNegotiable;
    
    @Builder.Default
    private List<ProductImageDTO> images = new ArrayList<>();
}
