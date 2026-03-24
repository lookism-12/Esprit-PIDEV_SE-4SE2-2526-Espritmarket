package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ProductRequestDTO;
import esprit_market.dto.marketplace.ProductResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;

public interface IProductService {
    List<ProductResponseDTO> findAll();

    ProductResponseDTO findById(ObjectId id);

    ProductResponseDTO create(ProductRequestDTO dto);

    ProductResponseDTO update(ObjectId id, ProductRequestDTO dto);

    void deleteById(ObjectId id);
}
