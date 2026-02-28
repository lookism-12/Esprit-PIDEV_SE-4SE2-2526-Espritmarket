package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.entity.carpooling.Ride;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface IRideService {
    List<Ride> findAll();

    Ride findById(ObjectId id);

    Ride save(Ride ride);

    Ride update(ObjectId id, Ride ride);

    void deleteById(ObjectId id);

    List<Ride> findByDriverProfileId(ObjectId driverProfileId);

    Ride updateStatus(ObjectId id, RideStatus status);

    List<Ride> findByFilters(String departureLocation, String destinationLocation, LocalDateTime departureTime,
            Integer availableSeats, RideStatus status, Pageable pageable);

    void cancelRide(String rideId, String driverEmail);

    List<esprit_market.dto.carpooling.RideResponseDTO> getMyRides(String driverEmail);

    esprit_market.entity.carpooling.DriverProfile getDriverProfileByUserId(ObjectId userId);

    esprit_market.dto.carpooling.RideResponseDTO toResponseDTO(Ride ride);
}
