package esprit_market.mappers.carpooling;


import esprit_market.dto.carpoolingDto.VehicleResponseDTO;
import esprit_market.entity.carpooling.Vehicle;
import org.springframework.stereotype.Component;

@Component
public class VehicleMapper {

    public VehicleResponseDTO toResponseDTO(Vehicle vehicle) {
        if (vehicle == null)
            return null;

        return VehicleResponseDTO.builder()
                .id(vehicle.getId() != null ? vehicle.getId().toHexString() : null)
                .driverProfileId(
                        vehicle.getDriverProfileId() != null ? vehicle.getDriverProfileId().toHexString() : null)
                .make(vehicle.getMake())
                .model(vehicle.getModel())
                .licensePlate(vehicle.getLicensePlate())
                .numberOfSeats(vehicle.getNumberOfSeats())
                .createdAt(vehicle.getCreatedAt())
                .updatedAt(vehicle.getUpdatedAt())
                .build();
    }
}
