package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ProductCategoryRequestDTO;
import esprit_market.dto.marketplace.ProductCategoryResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;

public interface IProductCategoryService {
    List<ProductCategoryResponseDTO> findAll();

    ProductCategoryResponseDTO findById(ObjectId id);

    ProductCategoryResponseDTO create(ProductCategoryRequestDTO dto);

    void deleteById(ObjectId id);

    List<ProductCategoryResponseDTO> findByProductId(ObjectId productId);

    List<ProductCategoryResponseDTO> findByCategoryId(ObjectId categoryId);
}
