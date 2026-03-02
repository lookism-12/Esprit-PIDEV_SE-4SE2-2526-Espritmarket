package esprit_market.repository.cartRepository;

import esprit_market.entity.cart.LoyaltyCard;
import esprit_market.entity.user.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LoyaltyCardRepository extends MongoRepository<LoyaltyCard, ObjectId> {
    Optional<LoyaltyCard> findByUserId(ObjectId userId);
    
    Optional<LoyaltyCard> findByUser(User user);
    
    boolean existsByUserId(ObjectId userId);
}
