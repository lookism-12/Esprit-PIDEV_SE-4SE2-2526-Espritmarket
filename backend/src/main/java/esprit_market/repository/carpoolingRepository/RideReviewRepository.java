package esprit_market.repository.carpoolingRepository;

import esprit_market.entity.carpooling.RideReview;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RideReviewRepository extends MongoRepository<RideReview, ObjectId> {

    /** All reviews received by a user (as reviewee) — sorted newest first */
    List<RideReview> findByRevieweeIdOrderByCreatedAtDesc(ObjectId revieweeId);

    /** All reviews received by a user (as reviewee) — unsorted, for backward compat */
    List<RideReview> findByRevieweeId(ObjectId revieweeId);

    /** All reviews written by a user (as reviewer) */
    List<RideReview> findByReviewerIdOrderByCreatedAtDesc(ObjectId reviewerId);

    /** All reviews for a specific ride */
    List<RideReview> findByRideId(ObjectId rideId);

    /** Check if a reviewer already reviewed a specific ride */
    Optional<RideReview> findByRideIdAndReviewerId(ObjectId rideId, ObjectId reviewerId);

    /** Count reviews received by a user */
    long countByRevieweeId(ObjectId revieweeId);
}
