package esprit_market.mappers.marketplace;

import esprit_market.dto.marketplace.ShopRequestDTO;
import esprit_market.dto.marketplace.ShopResponseDTO;
import esprit_market.entity.marketplace.Shop;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

@Component
public class ShopMapper {

    public ShopResponseDTO toDTO(Shop shop) {
        if (shop == null)
            return null;
        return ShopResponseDTO.builder()
                .id(shop.getId() != null ? shop.getId().toHexString() : null)
                .ownerId(shop.getOwnerId() != null ? shop.getOwnerId().toHexString() : null)
                .name(shop.getName())
                .description(shop.getDescription())
                .productCount(0)  // Will be set by service
                .ownerName(null)  // Will be set by service
                .build();
    }

    public Shop toEntity(ShopRequestDTO dto) {
        if (dto == null)
            return null;
        return Shop.builder()
                .ownerId(dto.getOwnerId() != null ? new ObjectId(dto.getOwnerId()) : null)
                .name(dto.getName())
                .description(dto.getDescription())
                .build();
    }
}
