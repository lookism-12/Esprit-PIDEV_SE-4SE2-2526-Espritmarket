package esprit_market.dto.marketplace;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.ArrayList;
import java.util.List;

import esprit_market.entity.marketplace.ProductStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequestDTO {
    private String name;
    private String description;
    private String shopId;
    @Builder.Default
    private List<String> categoryIds = new ArrayList<>();
    private double price;
    private int stock;
    @Builder.Default
    private List<ProductImageDTO> images = new ArrayList<>();
    private ProductStatus status;
}
