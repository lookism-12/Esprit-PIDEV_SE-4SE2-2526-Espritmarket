package esprit_market.mappers.marketplace;

import esprit_market.dto.marketplace.ServiceRequestDTO;
import esprit_market.dto.marketplace.ServiceResponseDTO;
import esprit_market.entity.marketplace.ServiceEntity;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

@Component
public class ServiceMapper {

    public ServiceResponseDTO toDTO(ServiceEntity service) {
        if (service == null)
            return null;
        return ServiceResponseDTO.builder()
                .id(service.getId() != null ? service.getId().toHexString() : null)
                .name(service.getName())
                .description(service.getDescription())
                .price(service.getPrice())
                .shopId(service.getShopId() != null ? service.getShopId().toHexString() : null)
                .categoryId(service.getCategoryId() != null ? service.getCategoryId().toHexString() : null)
                .build();
    }

    public ServiceEntity toEntity(ServiceRequestDTO dto) {
        if (dto == null)
            return null;
        return ServiceEntity.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .shopId(dto.getShopId() != null ? new ObjectId(dto.getShopId()) : null)
                .categoryId(dto.getCategoryId() != null ? new ObjectId(dto.getCategoryId()) : null)
                .build();
    }
}
