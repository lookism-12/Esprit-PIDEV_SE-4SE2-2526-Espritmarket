package esprit_market.repository.cartRepository;

import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.entity.cart.Cart;
import esprit_market.entity.user.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends MongoRepository<Cart, ObjectId> {
    Optional<Cart> findByUserIdAndStatus(ObjectId userId, CartStatus status);
    
    Optional<Cart> findByUserAndStatus(User user, CartStatus status);
    
    List<Cart> findByUserId(ObjectId userId);
    
    List<Cart> findByUser(User user);
    
    List<Cart> findByStatus(CartStatus status);
    
    List<Cart> findByStatusAndLastUpdatedBefore(CartStatus status, LocalDateTime date);
    
    boolean existsByUserIdAndStatus(ObjectId userId, CartStatus status);
}
