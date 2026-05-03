package esprit_market.entity.carpooling;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "passenger_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerProfile {
    @Id
    private ObjectId id;

    @Indexed(unique = true)
    private ObjectId userId;

    private Float averageRating;
    private String preferences;

    private java.util.List<ObjectId> bookingIds;
    private Integer totalRidesCompleted;

    // ── Engagement & Discount System ─────────────────────────────────────────
    /** Cumulative engagement points earned (bookings + ride requests + feedback) */
    @Builder.Default
    private Integer engagementPoints = 0;

    /** Number of feedback/reviews submitted */
    @Builder.Default
    private Integer feedbackCount = 0;

    /** Number of ride requests created */
    @Builder.Default
    private Integer rideRequestCount = 0;

    /** Number of confirmed bookings made */
    @Builder.Default
    private Integer bookedRidesCount = 0;

    /** Current discount tier: NONE / BRONZE / SILVER / GOLD / PLATINUM */
    @Builder.Default
    private String engagementTier = "NONE";

    /** Current discount percentage unlocked (0, 5, 10, 15, 20) */
    @Builder.Default
    private Integer discountPercentage = 0;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
