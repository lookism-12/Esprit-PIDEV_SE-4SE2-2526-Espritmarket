package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.PassengerEngagementDTO;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.user.User;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

/**
 * Manages passenger engagement points and discount tiers.
 *
 * Tier thresholds (cumulative engagement points):
 *   NONE      0  – 49   →  0 % discount
 *   BRONZE   50  – 149  →  5 % discount
 *   SILVER  150  – 299  → 10 % discount
 *   GOLD    300  – 499  → 15 % discount
 *   PLATINUM 500+       → 20 % discount
 *
 * Points per action:
 *   Booking confirmed  → +10 pts
 *   Ride request sent  →  +5 pts
 *   Feedback submitted → +15 pts
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PassengerEngagementService {

    private final PassengerProfileRepository passengerProfileRepository;
    private final UserRepository userRepository;

    // ── Tier configuration ────────────────────────────────────────────────────

    private static final int[] TIER_THRESHOLDS  = { 0, 50, 150, 300, 500 };
    private static final String[] TIER_NAMES    = { "NONE", "BRONZE", "SILVER", "GOLD", "PLATINUM" };
    private static final int[] TIER_DISCOUNTS   = { 0, 5, 10, 15, 20 };

    // ── Point values ──────────────────────────────────────────────────────────

    public static final int POINTS_BOOKING      = 10;
    public static final int POINTS_RIDE_REQUEST =  5;
    public static final int POINTS_FEEDBACK     = 15;

    // ── Public API ────────────────────────────────────────────────────────────

    /** Award points for a confirmed booking. */
    public void awardBookingPoints(ObjectId passengerProfileId) {
        addPoints(passengerProfileId, POINTS_BOOKING, "booking");
        passengerProfileRepository.findById(passengerProfileId).ifPresent(p -> {
            p.setBookedRidesCount(safeInt(p.getBookedRidesCount()) + 1);
            passengerProfileRepository.save(p);
        });
    }

    /** Award points for submitting a ride request. */
    public void awardRideRequestPoints(ObjectId passengerProfileId) {
        addPoints(passengerProfileId, POINTS_RIDE_REQUEST, "ride-request");
        passengerProfileRepository.findById(passengerProfileId).ifPresent(p -> {
            p.setRideRequestCount(safeInt(p.getRideRequestCount()) + 1);
            passengerProfileRepository.save(p);
        });
    }

    /** Award points for submitting feedback/review. */
    public void awardFeedbackPoints(ObjectId passengerProfileId) {
        addPoints(passengerProfileId, POINTS_FEEDBACK, "feedback");
        passengerProfileRepository.findById(passengerProfileId).ifPresent(p -> {
            p.setFeedbackCount(safeInt(p.getFeedbackCount()) + 1);
            passengerProfileRepository.save(p);
        });
    }

    /** Build the engagement DTO for the current authenticated user. */
    public PassengerEngagementDTO getEngagement(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        PassengerProfile profile = passengerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));
        return buildDTO(profile);
    }

    /** Build the engagement DTO for a passenger profile ID. */
    public PassengerEngagementDTO getEngagementByProfileId(ObjectId profileId) {
        PassengerProfile profile = passengerProfileRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));
        return buildDTO(profile);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void addPoints(ObjectId passengerProfileId, int points, String reason) {
        passengerProfileRepository.findById(passengerProfileId).ifPresent(profile -> {
            int newPoints = safeInt(profile.getEngagementPoints()) + points;
            profile.setEngagementPoints(newPoints);
            recalculateTier(profile);
            passengerProfileRepository.save(profile);
            log.debug("Passenger {} +{} pts ({}) → total={} tier={}",
                    passengerProfileId, points, reason, newPoints, profile.getEngagementTier());
        });
    }

    private void recalculateTier(PassengerProfile profile) {
        int pts = safeInt(profile.getEngagementPoints());
        int tierIndex = 0;
        for (int i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
            if (pts >= TIER_THRESHOLDS[i]) {
                tierIndex = i;
                break;
            }
        }
        profile.setEngagementTier(TIER_NAMES[tierIndex]);
        profile.setDiscountPercentage(TIER_DISCOUNTS[tierIndex]);
    }

    private PassengerEngagementDTO buildDTO(PassengerProfile profile) {
        int pts = safeInt(profile.getEngagementPoints());
        String tier = profile.getEngagementTier() != null ? profile.getEngagementTier() : "NONE";

        // Find current tier index
        int currentIdx = 0;
        for (int i = 0; i < TIER_NAMES.length; i++) {
            if (TIER_NAMES[i].equals(tier)) { currentIdx = i; break; }
        }

        boolean isPlatinum = currentIdx == TIER_NAMES.length - 1;
        int pointsToNext = 0;
        String nextTier = null;
        int progressPercent = 100;
        int nextTierDiscount = TIER_DISCOUNTS[currentIdx];

        if (!isPlatinum) {
            int nextIdx = currentIdx + 1;
            nextTier = TIER_NAMES[nextIdx];
            nextTierDiscount = TIER_DISCOUNTS[nextIdx];
            int currentThreshold = TIER_THRESHOLDS[currentIdx];
            int nextThreshold = TIER_THRESHOLDS[nextIdx];
            pointsToNext = nextThreshold - pts;
            int rangeSize = nextThreshold - currentThreshold;
            int earned = pts - currentThreshold;
            progressPercent = (int) Math.min(100, Math.max(0, (earned * 100.0) / rangeSize));
        }

        return PassengerEngagementDTO.builder()
                .engagementPoints(pts)
                .engagementTier(tier)
                .discountPercentage(safeInt(profile.getDiscountPercentage()))
                .feedbackCount(safeInt(profile.getFeedbackCount()))
                .rideRequestCount(safeInt(profile.getRideRequestCount()))
                .bookedRidesCount(safeInt(profile.getBookedRidesCount()))
                .pointsToNextTier(isPlatinum ? 0 : pointsToNext)
                .nextTier(nextTier)
                .progressPercent(progressPercent)
                .nextTierDiscount(nextTierDiscount)
                .build();
    }

    private int safeInt(Integer val) {
        return val != null ? val : 0;
    }
}
