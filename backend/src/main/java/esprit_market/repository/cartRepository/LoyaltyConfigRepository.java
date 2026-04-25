package esprit_market.repository.cartRepository;

import esprit_market.entity.cart.LoyaltyConfig;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoyaltyConfigRepository extends MongoRepository<LoyaltyConfig, ObjectId> {
    
    /**
     * Find the active loyalty configuration
     * There should only be one active config at a time
     */
    Optional<LoyaltyConfig> findByActiveTrue();
    
    /**
     * Check if an active configuration exists
     */
    boolean existsByActiveTrue();
}
