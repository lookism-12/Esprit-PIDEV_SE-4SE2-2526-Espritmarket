package esprit_market.repository.cartRepository;

import esprit_market.entity.cart.LoyaltyReward;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoyaltyRewardRepository extends MongoRepository<LoyaltyReward, ObjectId> {
    
    /**
     * Find all active rewards ordered by points required
     */
    List<LoyaltyReward> findByActiveTrueOrderByPointsRequiredAsc();
    
    /**
     * Find all rewards ordered by display order
     */
    List<LoyaltyReward> findAllByOrderByDisplayOrderAsc();
    
    /**
     * Find rewards that user can afford
     */
    List<LoyaltyReward> findByActiveTrueAndPointsRequiredLessThanEqualOrderByPointsRequiredAsc(Integer points);
}
