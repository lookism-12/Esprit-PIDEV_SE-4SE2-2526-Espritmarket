package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.RideReview;
import org.bson.types.ObjectId;

import java.util.List;

public interface IRideReviewService {
    List<RideReview> findAll();

    RideReview save(RideReview review);

    RideReview findById(ObjectId id);

    void deleteById(ObjectId id);
}
