package esprit_market.mappers.marketplace;

import esprit_market.dto.marketplace.CategoryRequestDTO;
import esprit_market.dto.marketplace.CategoryResponseDTO;
import esprit_market.entity.marketplace.Category;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.stream.Collectors;

@Component
public class CategoryMapper {

    public CategoryResponseDTO toDTO(Category category) {
        if (category == null)
            return null;
        return CategoryResponseDTO.builder()
                .id(category.getId() != null ? category.getId().toHexString() : null)
                .name(category.getName())
                .productIds(category.getProductIds() != null
                        ? category.getProductIds().stream().map(ObjectId::toHexString).collect(Collectors.toList())
                        : new ArrayList<>())
                .build();
    }

    public Category toEntity(CategoryRequestDTO dto) {
        if (dto == null)
            return null;
        return Category.builder()
                .name(dto.getName())
                .build();
    }
}
