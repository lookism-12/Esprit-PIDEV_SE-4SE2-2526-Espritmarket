package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.carpooling.Ride;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RatingService {

    private final RideRepository rideRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PassengerProfileRepository passengerProfileRepository;

    public void updateDriverAverageRating(ObjectId driverProfileId) {
        List<Ride> rides = rideRepository.findByDriverProfileId(driverProfileId);
        double average = rides.stream()
                .filter(r -> r.getDriverRating() != null)
                .mapToInt(r -> r.getDriverRating())
                .average()
                .orElse(0.0);
        DriverProfile profile = driverProfileRepository.findById(driverProfileId).orElse(null);
        if (profile != null) {
            profile.setAverageRating((float) average);
            driverProfileRepository.save(profile);
            log.debug("Updated driver average rating for {}: {}", driverProfileId, average);
        }
    }

    public void updatePassengerAverageRating(ObjectId passengerProfileId) {
        PassengerProfile profile = passengerProfileRepository.findById(passengerProfileId).orElse(null);
        if (profile != null) {
            profile.setAverageRating(4.5f);
            passengerProfileRepository.save(profile);
        }
    }
}
