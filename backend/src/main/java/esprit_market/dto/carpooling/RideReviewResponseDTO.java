package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideReviewResponseDTO {
    private String id;
    private String rideId;
    private String reviewerId;
    private String reviewerName;
    private String revieweeId;
    private String revieweeName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
