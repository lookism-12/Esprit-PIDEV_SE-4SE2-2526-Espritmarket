package esprit_market.mappers.carpooling;

import esprit_market.dto.carpooling.RideResponseDTO;
import esprit_market.entity.carpooling.Ride;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.VehicleRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RideMapper {

    private final DriverProfileRepository driverProfileRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;

    public RideResponseDTO toResponseDTO(Ride ride) {
        if (ride == null)
            return null;

        String driverName = "";
        String vehicleMake = "";
        String vehicleModel = "";

        var driverProfile = driverProfileRepository.findById(ride.getDriverProfileId()).orElse(null);
        if (driverProfile != null) {
            var user = userRepository.findById(driverProfile.getUserId()).orElse(null);
            if (user != null)
                driverName = user.getFirstName() + " " + user.getLastName();
        }

        var vehicle = vehicleRepository.findById(ride.getVehicleId()).orElse(null);
        if (vehicle != null) {
            vehicleMake = vehicle.getMake();
            vehicleModel = vehicle.getModel();
        }

        return RideResponseDTO.builder()
                .rideId(ride.getId() != null ? ride.getId().toHexString() : null)
                .driverProfileId(ride.getDriverProfileId() != null ? ride.getDriverProfileId().toHexString() : null)
                .driverName(driverName)
                .vehicleId(ride.getVehicleId() != null ? ride.getVehicleId().toHexString() : null)
                .vehicleMake(vehicleMake)
                .vehicleModel(vehicleModel)
                .departureLocation(ride.getDepartureLocation())
                .destinationLocation(ride.getDestinationLocation())
                .departureTime(ride.getDepartureTime())
                .availableSeats(ride.getAvailableSeats())
                .pricePerSeat(ride.getPricePerSeat())
                .status(ride.getStatus())
                .completedAt(ride.getCompletedAt())
                .build();
    }
}
