package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.dto.carpooling.RideRequestDTO;
import esprit_market.dto.carpooling.RideResponseDTO;
import esprit_market.entity.carpooling.Ride;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface IRideService {
        List<RideResponseDTO> findAll();

        RideResponseDTO findById(ObjectId id);

        RideResponseDTO save(Ride ride);

        RideResponseDTO update(ObjectId id, Ride ride);

        void deleteById(ObjectId id);

        long countActiveRides();

        List<RideResponseDTO> findByDriverProfileId(ObjectId driverProfileId);

        RideResponseDTO updateStatus(ObjectId id, RideStatus status);

        List<RideResponseDTO> findByFilters(String departureLocation, String destinationLocation,
                        LocalDateTime departureTime,
                        Integer availableSeats, RideStatus status, Pageable pageable);

        void cancelRide(String rideId, String driverEmail);

        List<RideResponseDTO> getMyRides(String driverEmail);

        esprit_market.entity.carpooling.DriverProfile getDriverProfileByUserId(ObjectId userId);

        RideResponseDTO createRide(RideRequestDTO dto, String driverEmail);

        RideResponseDTO updateRide(String rideId, RideRequestDTO dto, String driverEmail);

        List<RideResponseDTO> searchRides(String departureLocation, String destinationLocation,
                        LocalDateTime departureTime,
                        Integer availableSeats);

        List<RideResponseDTO> findByDriverUserId(String email);

        void processStatusTransitions();

        void rateRide(String rideId, Integer rating, String comment, boolean isDriverRating);
}
