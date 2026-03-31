package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ProductRequestDTO;
import esprit_market.dto.marketplace.ProductResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;

public interface IProductService {
    List<ProductResponseDTO> findAll();
    List<ProductResponseDTO> findAllApproved();

    /**
     * All products for the current seller's shop (any status).
     */
    List<ProductResponseDTO> findForCurrentSeller();

    /**
     * All products for a specific shop by shop ID.
     */
    List<ProductResponseDTO> findByShopId(String shopId);

    ProductResponseDTO findById(ObjectId id);

    ProductResponseDTO create(ProductRequestDTO dto);

    ProductResponseDTO update(ObjectId id, ProductRequestDTO dto);

    void deleteById(ObjectId id);

    ProductResponseDTO approve(ObjectId id);

    ProductResponseDTO reject(ObjectId id);
}
