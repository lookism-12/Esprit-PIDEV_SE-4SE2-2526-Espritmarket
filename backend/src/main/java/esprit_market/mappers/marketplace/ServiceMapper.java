package esprit_market.mappers.marketplace;

import esprit_market.dto.marketplace.ServiceAvailabilityDTO;
import esprit_market.dto.marketplace.ServiceRequestDTO;
import esprit_market.dto.marketplace.ServiceResponseDTO;
import esprit_market.entity.marketplace.ServiceAvailability;
import esprit_market.entity.marketplace.ServiceEntity;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

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
