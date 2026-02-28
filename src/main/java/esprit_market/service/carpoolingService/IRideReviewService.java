package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.RideReview;
import org.bson.types.ObjectId;

import java.util.List;

public interface IRideReviewService {
    List<RideReview> findAll();

    RideReview findById(ObjectId id);

    void deleteById(ObjectId id);

    List<RideReview> findByRideId(ObjectId rideId);

    List<RideReview> findByReviewerId(ObjectId reviewerId);

    List<RideReview> findByRevieweeId(ObjectId revieweeId);

    List<RideReview> findByRating(Integer rating);
}
