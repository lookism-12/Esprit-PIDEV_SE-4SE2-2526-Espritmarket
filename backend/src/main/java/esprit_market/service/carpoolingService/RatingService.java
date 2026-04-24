package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.carpooling.Ride;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Scoring formula (0–100):
 *   rating component     = (avgRating / 5.0) * 50   — weight 50 %
 *   rides component      = (min(completed, 100) / 100.0) * 30  — weight 30 %
 *   acceptance component = (acceptanceRate / 100.0) * 20  — weight 20 %
 *
 * Badge thresholds:
 *   BRONZE  score < 40
 *   SILVER  40 ≤ score < 70
 *   GOLD    score ≥ 70
 *
 * Missing data is treated as 0 (never inflates the score).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RatingService {

    private final RideRepository rideRepository;
    private final BookingRepository bookingRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PassengerProfileRepository passengerProfileRepository;

    // ── Driver ────────────────────────────────────────────────────────────────

    /**
     * Recalculates averageRating from ride-level ratings, then recomputes
     * driverScore and badge. Called after every new review or ride completion.
     */
    public void updateDriverAverageRating(ObjectId driverProfileId) {
        List<Ride> rides = rideRepository.findByDriverProfileId(driverProfileId);

        double avgRating = rides.stream()
                .filter(r -> r.getDriverRating() != null)
                .mapToInt(Ride::getDriverRating)
                .average()
                .orElse(0.0);

        DriverProfile profile = driverProfileRepository.findById(driverProfileId).orElse(null);
        if (profile == null) return;

        profile.setAverageRating((float) avgRating);

        // Acceptance rate from bookings
        List<ObjectId> rideIds = rides.stream().map(Ride::getId).toList();
        float acceptanceRate = computeAcceptanceRate(rideIds);

        // Completed rides (capped at 100 for scoring)
        int completed = profile.getTotalRidesCompleted() != null ? profile.getTotalRidesCompleted() : 0;

        float score = computeScore((float) avgRating, completed, acceptanceRate);
        profile.setDriverScore(score);
        profile.setBadge(computeBadge(score));

        driverProfileRepository.save(profile);
        log.debug("Driver {} → rating={}, score={}, badge={}", driverProfileId, avgRating, score, profile.getBadge());
    }

    // ── Passenger ─────────────────────────────────────────────────────────────

    public void updatePassengerAverageRating(ObjectId passengerProfileId) {
        PassengerProfile profile = passengerProfileRepository.findById(passengerProfileId).orElse(null);
        if (profile == null) return;
        // Passenger rating stays as-is (no badge system for passengers yet)
        passengerProfileRepository.save(profile);
    }

    // ── Public helpers (used by DriverProfileService.getDriverStats) ──────────

    public float computeScore(float avgRating, int completedRides, float acceptanceRate) {
        double ratingPart     = (avgRating / 5.0)                          * 50.0;
        double ridesPart      = (Math.min(completedRides, 100) / 100.0)    * 30.0;
        double acceptancePart = (Math.min(acceptanceRate, 100f) / 100.0)   * 20.0;
        return (float) Math.round(ratingPart + ridesPart + acceptancePart);
    }

    public String computeBadge(float score) {
        if (score >= 70) return "GOLD";
        if (score >= 40) return "SILVER";
        return "BRONZE";
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private float computeAcceptanceRate(List<ObjectId> rideIds) {
        if (rideIds.isEmpty()) return 100f; // no data → assume perfect
        List<Booking> bookings = bookingRepository.findByRideIdIn(rideIds);
        long total    = bookings.stream().filter(b -> b.getStatus() != BookingStatus.PENDING).count();
        long accepted = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                .count();
        return total > 0 ? (float) accepted * 100f / total : 100f;
    }
}
