package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.FavorisRequestDTO;
import esprit_market.dto.marketplace.FavorisResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;

public interface IFavorisService {
    List<FavorisResponseDTO> findAll();

    FavorisResponseDTO create(FavorisRequestDTO dto);

    List<FavorisResponseDTO> getByUserId(ObjectId userId);

    FavorisResponseDTO update(ObjectId id, FavorisRequestDTO dto);

    void delete(ObjectId id);

    FavorisResponseDTO findById(ObjectId id);
}
