package esprit_market.mappers.carpooling;

import esprit_market.dto.carpooling.RideReviewResponseDTO;
import esprit_market.entity.carpooling.RideReview;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.entity.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RideReviewMapper {

    private final UserRepository userRepository;

    public RideReviewResponseDTO toResponseDTO(RideReview review) {
        if (review == null)
            return null;

        String reviewerName = "";
        String revieweeName = "";

        if (review.getReviewerId() != null) {
            User reviewer = userRepository.findById(review.getReviewerId()).orElse(null);
            if (reviewer != null) {
                reviewerName = reviewer.getFirstName() + " " + reviewer.getLastName();
            }
        }

        if (review.getRevieweeId() != null) {
            User reviewee = userRepository.findById(review.getRevieweeId()).orElse(null);
            if (reviewee != null) {
                revieweeName = reviewee.getFirstName() + " " + reviewee.getLastName();
            }
        }

        return RideReviewResponseDTO.builder()
                .id(review.getId() != null ? review.getId().toHexString() : null)
                .rideId(review.getRideId() != null ? review.getRideId().toHexString() : null)
                .reviewerId(review.getReviewerId() != null ? review.getReviewerId().toHexString() : null)
                .reviewerName(reviewerName)
                .revieweeId(review.getRevieweeId() != null ? review.getRevieweeId().toHexString() : null)
                .revieweeName(revieweeName)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
