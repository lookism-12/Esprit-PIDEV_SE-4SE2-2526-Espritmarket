package esprit_market.mappers.marketplace;

import esprit_market.dto.marketplace.ProductCategoryRequestDTO;
import esprit_market.dto.marketplace.ProductCategoryResponseDTO;
import esprit_market.entity.marketplace.ProductCategory;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

@Component
public class ProductCategoryMapper {

    public ProductCategoryResponseDTO toDTO(ProductCategory pc) {
        if (pc == null)
            return null;
        return ProductCategoryResponseDTO.builder()
                .id(pc.getId() != null ? pc.getId().toHexString() : null)
                .productId(pc.getProductId() != null ? pc.getProductId().toHexString() : null)
                .categoryId(pc.getCategoryId() != null ? pc.getCategoryId().toHexString() : null)
                .build();
    }

    public ProductCategory toEntity(ProductCategoryRequestDTO dto) {
        if (dto == null)
            return null;
        return ProductCategory.builder()
                .productId(dto.getProductId() != null ? new ObjectId(dto.getProductId()) : null)
                .categoryId(dto.getCategoryId() != null ? new ObjectId(dto.getCategoryId()) : null)
                .build();
    }
}
