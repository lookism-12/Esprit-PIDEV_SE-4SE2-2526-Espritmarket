package esprit_market.repository.cartRepository;

import esprit_market.Enum.cartEnum.RewardStatus;
import esprit_market.entity.cart.UserReward;
import esprit_market.entity.user.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRewardRepository extends MongoRepository<UserReward, ObjectId> {
    
    /**
     * Find all active rewards for a user
     */
    List<UserReward> findByUserAndStatusOrderByCreatedAtDesc(User user, RewardStatus status);
    
    /**
     * Find all rewards for a user
     */
    List<UserReward> findByUserOrderByCreatedAtDesc(User user);
    
    /**
     * Find reward by coupon code
     */
    Optional<UserReward> findByCouponCode(String couponCode);
    
    /**
     * Find expired rewards that need to be marked as expired
     */
    List<UserReward> findByStatusAndExpiresAtBefore(RewardStatus status, LocalDateTime now);
    
    /**
     * Count active rewards for a user
     */
    Long countByUserAndStatus(User user, RewardStatus status);
}
