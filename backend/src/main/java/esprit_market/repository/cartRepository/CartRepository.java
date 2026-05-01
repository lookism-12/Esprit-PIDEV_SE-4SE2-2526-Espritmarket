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
    // Use consistent User entity-based queries since Cart has @DBRef User user
    Optional<Cart> findByUserAndStatus(User user, CartStatus status);
    
    // Add method to handle multiple draft carts (to fix the "non unique result" issue)
    List<Cart> findAllByUserAndStatus(User user, CartStatus status);
    
    List<Cart> findByUser(User user);
    
    List<Cart> findByStatus(CartStatus status);
    
    List<Cart> findByStatusAndLastUpdatedBefore(CartStatus status, LocalDateTime date);
    
    boolean existsByUserAndStatus(User user, CartStatus status);
    
    // Provider Dashboard - Get all non-draft carts (orders)
    List<Cart> findByStatusIn(List<CartStatus> statuses);

    // SAV - Find all carts by userId field directly (avoids @DBRef lazy-load)
    List<Cart> findByUserId(ObjectId userId);
    
    // ==================== CART EXPIRATION QUERIES ====================
    
    /**
     * Find DRAFT carts last updated before a given date that haven't sent 24h notification yet.
     * Used by the scheduled job that sends "24h remaining" warnings.
     */
    List<Cart> findByStatusAndLastUpdatedBeforeAndNotification24hSent(
            CartStatus status, LocalDateTime date, Boolean notification24hSent);
    
    /**
     * Find DRAFT carts last updated before a given date that haven't sent 47.5h notification yet.
     * Used by the scheduled job that sends "expiring soon" urgent alerts.
     */
    List<Cart> findByStatusAndLastUpdatedBeforeAndNotification47hSent(
            CartStatus status, LocalDateTime date, Boolean notification47hSent);
}

