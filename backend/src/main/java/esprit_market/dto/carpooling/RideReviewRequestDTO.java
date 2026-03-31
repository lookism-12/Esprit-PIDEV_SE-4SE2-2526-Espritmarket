package esprit_market.dto.carpooling;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ride Review Request DTO
 * Used for POST /api/ride-reviews endpoint
 * Transfers rating and feedback from frontend to backend
 * 
 * Frontend -> Backend: Submit review for a ride
 * All fields are validated before processing
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideReviewRequestDTO {

    /** ID of ride being reviewed */
    @NotBlank(message = "Ride ID is required")
    private String rideId;

    /** User ID of person being reviewed (reviewer or reviewee) */
    @NotBlank(message = "Reviewee ID is required")
    private String revieweeId;

    /** Star rating 1-5 */
    @NotNull
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    /** Written feedback/comment (optional, max 500 chars) */
    @Size(max = 500, message = "Comment cannot exceed 500 characters")
    private String comment;
}
