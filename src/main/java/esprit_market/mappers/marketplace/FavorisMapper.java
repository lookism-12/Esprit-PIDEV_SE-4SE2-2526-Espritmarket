package esprit_market.mappers.marketplace;

import esprit_market.dto.marketplace.FavorisRequestDTO;
import esprit_market.dto.marketplace.FavorisResponseDTO;
import esprit_market.entity.marketplace.Favoris;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

@Component
public class FavorisMapper {

    public FavorisResponseDTO toDTO(Favoris favoris) {
        if (favoris == null)
            return null;
        return FavorisResponseDTO.builder()
                .id(favoris.getId() != null ? favoris.getId().toHexString() : null)
                .userId(favoris.getUserId() != null ? favoris.getUserId().toHexString() : null)
                .productId(favoris.getProductId() != null ? favoris.getProductId().toHexString() : null)
                .serviceId(favoris.getServiceId() != null ? favoris.getServiceId().toHexString() : null)
                .createdAt(favoris.getCreatedAt())
                .build();
    }

    public Favoris toEntity(FavorisRequestDTO dto) {
        if (dto == null)
            return null;
        return Favoris.builder()
                .userId(dto.getUserId() != null ? new ObjectId(dto.getUserId()) : null)
                .productId(dto.getProductId() != null ? new ObjectId(dto.getProductId()) : null)
                .serviceId(dto.getServiceId() != null ? new ObjectId(dto.getServiceId()) : null)
                .build();
    }
}
