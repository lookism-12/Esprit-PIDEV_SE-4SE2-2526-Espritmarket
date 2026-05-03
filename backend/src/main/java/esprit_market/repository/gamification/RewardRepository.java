package esprit_market.repository.gamification;

import esprit_market.entity.gamification.Reward;
import esprit_market.entity.gamification.UserSegment;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RewardRepository extends MongoRepository<Reward, ObjectId> {
    
    /**
     * Find all active rewards
     */
    List<Reward> findByActiveTrue();
    
    /**
     * Find active rewards for a specific user segment
     */
    List<Reward> findByActiveTrueAndTargetSegmentIn(List<UserSegment> segments);
}
