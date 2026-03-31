package esprit_market.service.carpoolingService;

import esprit_market.dto.carpoolingDto.RideReviewRequestDTO;
import esprit_market.dto.carpoolingDto.RideReviewResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;

public interface IRideReviewService {
    List<RideReviewResponseDTO> findAll();

    RideReviewResponseDTO findById(ObjectId id);

    void deleteById(ObjectId id);

    List<RideReviewResponseDTO> findByRideId(ObjectId rideId);

    List<RideReviewResponseDTO> findByReviewerId(ObjectId reviewerId);

    List<RideReviewResponseDTO> findByRevieweeId(ObjectId revieweeId);

    List<RideReviewResponseDTO> findByRating(Integer rating);

    RideReviewResponseDTO submitReview(RideReviewRequestDTO dto, String reviewerEmail);

    List<RideReviewResponseDTO> findReceivedReviews(String revieweeEmail);
}
