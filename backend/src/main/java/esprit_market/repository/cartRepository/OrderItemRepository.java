package esprit_market.repository.cartRepository;

import esprit_market.entity.cart.OrderItem;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderItemRepository extends MongoRepository<OrderItem, ObjectId> {
    
    List<OrderItem> findByOrderId(ObjectId orderId);
    
    Optional<OrderItem> findByOrderIdAndProductId(ObjectId orderId, ObjectId productId);
    
    void deleteByOrderId(ObjectId orderId);
    
    long countByOrderId(ObjectId orderId);
    
    // ✅ CRITICAL: Find all order items for a specific shop (provider filtering)
    List<OrderItem> findByShopId(ObjectId shopId);

    /**
     * Fallback for legacy data where shopId was not persisted on OrderItem.
     * Allows provider filtering via Product.shopId.
     */
    List<OrderItem> findByProductIdIn(List<ObjectId> productIds);
}
