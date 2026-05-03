package esprit_market.mappers.marketplace;

import esprit_market.Enum.marketplaceEnum.AvailabilityMode;
import esprit_market.dto.marketplace.ServiceAvailabilityDTO;
import esprit_market.dto.marketplace.ServiceRequestDTO;
import esprit_market.dto.marketplace.ServiceResponseDTO;
import esprit_market.entity.marketplace.ServiceAvailability;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ServiceMapper {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;

    public ServiceResponseDTO toDTO(ServiceEntity service) {
        if (service == null)
            return null;

        // Resolve provider name
        String providerName = null;
        String providerAvatar = null;
        if (service.getCreatedByUserId() != null) {
            User creator = userRepository.findById(service.getCreatedByUserId()).orElse(null);
            if (creator != null) {
                String first = creator.getFirstName() != null ? creator.getFirstName() : "";
                String last  = creator.getLastName()  != null ? creator.getLastName()  : "";
                providerName   = (first + " " + last).trim();
                providerAvatar = creator.getAvatarUrl();
            }
        }

        // Resolve shop name
        String shopName = null;
        if (service.getShopId() != null) {
            Shop shop = shopRepository.findById(service.getShopId()).orElse(null);
            if (shop != null) shopName = shop.getName();
        }

        return ServiceResponseDTO.builder()
                .id(service.getId() != null ? service.getId().toHexString() : null)
                .name(service.getName())
                .description(service.getDescription())
                .price(service.getPrice())
                .shopId(service.getShopId() != null ? service.getShopId().toHexString() : null)
                .shopName(shopName)
                .categoryId(service.getCategoryId() != null ? service.getCategoryId().toHexString() : null)
                .createdByUserId(service.getCreatedByUserId() != null ? service.getCreatedByUserId().toHexString() : null)
                .providerName(providerName)
                .providerAvatar(providerAvatar)
                .durationMinutes(service.getDurationMinutes())
                .status(service.getStatus())
                .workingHoursStart(service.getWorkingHoursStart())
                .workingHoursEnd(service.getWorkingHoursEnd())
                .availability(toAvailabilityDTO(service.getAvailability()))
                .build();
    }

    public ServiceEntity toEntity(ServiceRequestDTO dto) {
        if (dto == null)
            return null;
        
        ServiceEntity.ServiceEntityBuilder builder = ServiceEntity.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .shopId(dto.getShopId() != null ? new ObjectId(dto.getShopId()) : null)
                .categoryId(dto.getCategoryId() != null ? new ObjectId(dto.getCategoryId()) : null);
        
        // Set duration if provided
        if (dto.getDurationMinutes() != null) {
            builder.durationMinutes(dto.getDurationMinutes());
        }
        
        // Set availability if provided
        if (dto.getAvailability() != null) {
            builder.availability(toAvailabilityEntity(dto.getAvailability()));
        }
        
        return builder.build();
    }
    
    private ServiceAvailabilityDTO toAvailabilityDTO(ServiceAvailability availability) {
        if (availability == null) {
            return null;
        }
        
        return ServiceAvailabilityDTO.builder()
                .workingDays(availability.getWorkingDays())
                .timeRanges(availability.getTimeRanges().stream()
                        .map(tr -> ServiceAvailabilityDTO.TimeRangeDTO.builder()
                                .startTime(tr.getStartTime())
                                .endTime(tr.getEndTime())
                                .availableMode(tr.getAvailableMode() != null ? tr.getAvailableMode() : AvailabilityMode.BOTH)
                                .build())
                        .collect(Collectors.toList()))
                .breaks(availability.getBreaks().stream()
                        .map(br -> ServiceAvailabilityDTO.TimeRangeDTO.builder()
                                .startTime(br.getStartTime())
                                .endTime(br.getEndTime())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
    
    public ServiceAvailability toAvailabilityEntity(ServiceAvailabilityDTO dto) {
        if (dto == null) {
            return new ServiceAvailability();
        }
        
        return ServiceAvailability.builder()
                .workingDays(dto.getWorkingDays())
                .timeRanges(dto.getTimeRanges().stream()
                        .map(tr -> ServiceAvailability.TimeRange.builder()
                                .startTime(tr.getStartTime())
                                .endTime(tr.getEndTime())
                                .availableMode(tr.getAvailableMode() != null ? tr.getAvailableMode() : AvailabilityMode.BOTH)
                                .build())
                        .collect(Collectors.toList()))
                .breaks(dto.getBreaks().stream()
                        .map(br -> ServiceAvailability.TimeRange.builder()
                                .startTime(br.getStartTime())
                                .endTime(br.getEndTime())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
