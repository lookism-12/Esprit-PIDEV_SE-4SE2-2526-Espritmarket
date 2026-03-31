package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Ride Review Response DTO
 * Used for GET /api/ride-reviews endpoints
 * Transfers comprehensive review data with reviewer/reviewee details
 * 
 * Backend -> Frontend: RideReview entity +  User denormalized data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideReviewResponseDTO {
    /** MongoDB ObjectId (string) */
    private String id;
    /** Reference to reviewed Ride */
    private String rideId;
    /** User ID of reviewer (who wrote it) */
    private String reviewerId;
    /** Denormalized: reviewer's full name */
    private String reviewerName;
    /** User ID of reviewee (who is being reviewed) */
    private String revieweeId;
    /** Denormalized: reviewee's full name */
    private String revieweeName;
    /** Star rating: 1-5 */
    private Integer rating;
    /** Written feedback (optional) */
    private String comment;
    /** Creation timestamp */
    private LocalDateTime createdAt;
    /** Last update timestamp */
    private LocalDateTime updatedAt;
}
