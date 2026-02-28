package esprit_market.repository.cartRepository;

import esprit_market.entity.cart.CartItem;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends MongoRepository<CartItem, ObjectId> {
    List<CartItem> findByCartId(ObjectId cartId);
    
    Optional<CartItem> findByCartIdAndProductId(ObjectId cartId, ObjectId productId);
    
    void deleteByCartId(ObjectId cartId);
    
    long countByCartId(ObjectId cartId);
}
