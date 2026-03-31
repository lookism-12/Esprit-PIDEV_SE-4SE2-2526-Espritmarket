package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ShopRequestDTO;
import esprit_market.dto.marketplace.ShopResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;

public interface IShopService {
    List<ShopResponseDTO> findAll();

    ShopResponseDTO findById(ObjectId id);

    /**
     * Shop owned by the currently authenticated user (seller).
     */
    ShopResponseDTO findMyShop();

    ShopResponseDTO create(ShopRequestDTO dto);

    ShopResponseDTO update(ObjectId id, ShopRequestDTO dto);

    void deleteById(ObjectId id);
}
