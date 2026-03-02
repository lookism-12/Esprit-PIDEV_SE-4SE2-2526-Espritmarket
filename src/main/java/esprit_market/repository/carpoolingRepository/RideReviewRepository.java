package esprit_market.repository.carpoolingRepository;

import esprit_market.entity.carpooling.RideReview;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideReviewRepository extends MongoRepository<RideReview, ObjectId> {

    List<RideReview> findByRideId(ObjectId rideId);

    List<RideReview> findByRevieweeId(ObjectId revieweeId);

    List<RideReview> findByReviewerId(ObjectId reviewerId);

    List<RideReview> findByRating(Integer rating);
}
