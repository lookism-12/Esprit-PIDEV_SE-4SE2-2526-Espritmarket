package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.CategoryRequestDTO;
import esprit_market.dto.marketplace.CategoryResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICategoryService {
    List<CategoryResponseDTO> findAll();

    CategoryResponseDTO findById(ObjectId id);

    CategoryResponseDTO create(CategoryRequestDTO dto);

    CategoryResponseDTO update(ObjectId id, CategoryRequestDTO dto);

    void deleteById(ObjectId id);
}
