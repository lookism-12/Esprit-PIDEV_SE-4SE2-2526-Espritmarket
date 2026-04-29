package esprit_market.repository.cartRepository;

import esprit_market.entity.cart.EventPromotion;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Event Promotion Repository
 */
@Repository
public interface EventPromotionRepository extends MongoRepository<EventPromotion, ObjectId> {
    
    /**
     * Find event promotion configuration by provider ID
     * Each provider has only one event promotion configuration
     */
    Optional<EventPromotion> findByProviderId(ObjectId providerId);
    
    /**
     * Find event promotion configuration by shop ID
     */
    Optional<EventPromotion> findByShopId(ObjectId shopId);
    
    /**
     * Check if provider already has event promotion configuration
     */
    boolean existsByProviderId(ObjectId providerId);
}
