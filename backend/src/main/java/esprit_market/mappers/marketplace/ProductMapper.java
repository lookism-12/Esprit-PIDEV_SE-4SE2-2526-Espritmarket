package esprit_market.mappers.marketplace;

import esprit_market.dto.marketplace.ProductImageDTO;
import esprit_market.dto.marketplace.ProductRequestDTO;
import esprit_market.dto.marketplace.ProductResponseDTO;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ProductImage;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ProductMapper {

    public ProductResponseDTO toDTO(Product product) {
        if (product == null)
            return null;

        List<String> categoryIds = product.getCategoryIds() != null
                ? product.getCategoryIds().stream().map(ObjectId::toHexString).collect(Collectors.toList())
                : new ArrayList<>();

        List<ProductImageDTO> images = product.getImages() != null
                ? product.getImages().stream()
                        .map(img -> new ProductImageDTO(img.getUrl(), img.getAltText()))
                        .collect(Collectors.toList())
                : new ArrayList<>();

        return ProductResponseDTO.builder()
                .id(product.getId() != null ? product.getId().toHexString() : null)
                .name(product.getName())
                .description(product.getDescription())
                .shopId(product.getShopId() != null ? product.getShopId().toHexString() : null)
                .categoryIds(categoryIds)
                .price(product.getPrice())
                .stock(product.getStock())
                .images(images)
                .build();
    }

    public Product toEntity(ProductRequestDTO dto) {
        if (dto == null)
            return null;

        List<ObjectId> categoryIds = dto.getCategoryIds() != null
                ? dto.getCategoryIds().stream().map(ObjectId::new).collect(Collectors.toList())
                : new ArrayList<>();

        List<ProductImage> images = dto.getImages() != null
                ? dto.getImages().stream()
                        .map(imgDto -> new ProductImage(imgDto.getUrl(), imgDto.getAltText()))
                        .collect(Collectors.toList())
                : new ArrayList<>();

        return Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .shopId(dto.getShopId() != null ? new ObjectId(dto.getShopId()) : null)
                .categoryIds(categoryIds)
                .price(dto.getPrice())
                .stock(dto.getStock())
                .images(images)
                .build();
    }
}
