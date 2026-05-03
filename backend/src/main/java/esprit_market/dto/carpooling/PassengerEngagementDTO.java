package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Passenger engagement & discount tier response.
 *
 * Tier thresholds (cumulative engagement points):
 *   NONE      0  – 49   →  0 % discount
 *   BRONZE   50  – 149  →  5 % discount
 *   SILVER  150  – 299  → 10 % discount
 *   GOLD    300  – 499  → 15 % discount
 *   PLATINUM 500+       → 20 % discount
 *
 * Points awarded per action:
 *   Booking confirmed  → +10 pts
 *   Ride request sent  →  +5 pts
 *   Feedback submitted → +15 pts
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerEngagementDTO {

    private Integer engagementPoints;
    private String  engagementTier;
    private Integer discountPercentage;

    private Integer feedbackCount;
    private Integer rideRequestCount;
    private Integer bookedRidesCount;

    /** Points needed to reach the next tier (0 if already PLATINUM) */
    private Integer pointsToNextTier;

    /** Name of the next tier (null if PLATINUM) */
    private String  nextTier;

    /** Progress percentage toward the next tier (0–100) */
    private Integer progressPercent;

    /** Discount percentage of the next tier */
    private Integer nextTierDiscount;
}
