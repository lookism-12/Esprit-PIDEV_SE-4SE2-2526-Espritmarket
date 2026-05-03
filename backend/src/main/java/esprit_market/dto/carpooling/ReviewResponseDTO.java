package esprit_market.dto.carpooling;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponseDTO {
    private String id;
    private String rideId;
    private String reviewerId;
    private String reviewerName;
    private String reviewerAvatar;
    private String revieweeId;
    private String revieweeName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    // Computed badge for the reviewee
    private String badge;
}
