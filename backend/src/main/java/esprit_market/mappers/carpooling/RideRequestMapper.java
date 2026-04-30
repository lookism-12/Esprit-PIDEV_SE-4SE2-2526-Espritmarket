package esprit_market.mappers.carpooling;

import esprit_market.dto.carpooling.RideRequestResponseDTO;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.carpooling.RideRequest;
import esprit_market.entity.user.User;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.userRepository.UserRepository;
import org.springframework.stereotype.Component;

@Component
public class RideRequestMapper {

    private final PassengerProfileRepository passengerProfileRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final UserRepository userRepository;

    public RideRequestMapper(PassengerProfileRepository passengerProfileRepository,
                             DriverProfileRepository driverProfileRepository,
                             UserRepository userRepository) {
        this.passengerProfileRepository = passengerProfileRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.userRepository = userRepository;
    }

    public RideRequestResponseDTO toResponseDTO(RideRequest request) {
        if (request == null) return null;

        String passengerName = "Passenger";
        String passengerUserId = null;
        PassengerProfile profile = passengerProfileRepository.findById(request.getPassengerProfileId()).orElse(null);
        if (profile != null) {
            User user = userRepository.findById(profile.getUserId()).orElse(null);
            if (user != null) {
                passengerName = user.getFirstName() + " " + user.getLastName();
                passengerUserId = user.getId().toHexString();
            }
        }

        String driverName = null;
        String driverUserId = null;
        if (request.getDriverProfileId() != null) {
            DriverProfile driverProfile = driverProfileRepository.findById(request.getDriverProfileId()).orElse(null);
            if (driverProfile != null) {
                User user = userRepository.findById(driverProfile.getUserId()).orElse(null);
                if (user != null) {
                    driverName = user.getFirstName() + " " + user.getLastName();
                    driverUserId = user.getId().toHexString();
                }
            }
        }

        return RideRequestResponseDTO.builder()
                .id(request.getId() != null ? request.getId().toHexString() : null)
                .passengerProfileId(request.getPassengerProfileId() != null ? request.getPassengerProfileId().toHexString() : null)
                .passengerName(passengerName)
                .departureLocation(request.getDepartureLocation())
                .destinationLocation(request.getDestinationLocation())
                .departureTime(request.getDepartureTime())
                .requestedSeats(request.getRequestedSeats())
                .proposedPrice(request.getProposedPrice())
                .status(request.getStatus())
                .driverId(request.getDriverProfileId() != null ? request.getDriverProfileId().toHexString() : null)
                .driverName(driverName)
                .rideId(request.getRideId() != null ? request.getRideId().toHexString() : null)
                .counterPrice(request.getCounterPrice())
                .counterPriceNote(request.getCounterPriceNote())
                .passengerUserId(passengerUserId)
                .driverUserId(driverUserId)
                .build();
    }
}
