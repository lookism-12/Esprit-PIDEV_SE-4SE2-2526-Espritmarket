package esprit_market.repository.cartRepository;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.entity.cart.Order;
import esprit_market.entity.user.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends MongoRepository<Order, ObjectId> {
    
    List<Order> findByUser(User user);
    
    org.springframework.data.domain.Page<Order> findByUser(User user, org.springframework.data.domain.Pageable pageable);
    
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    
    List<Order> findByStatus(OrderStatus status);
    
    List<Order> findByStatusIn(List<OrderStatus> statuses);
    
    Optional<Order> findByOrderNumber(String orderNumber);
    
    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    List<Order> findByUserAndStatus(User user, OrderStatus status);
    
    long countByStatus(OrderStatus status);
    
    long countByUser(User user);
    
    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime time);
    
    Optional<Order> findByCartId(ObjectId cartId);

    List<Order> findAllByCartId(ObjectId cartId);

    List<Order> findByPaymentMethodIn(List<String> paymentMethods);

    List<Order> findByPaymentMethodInAndStatus(List<String> paymentMethods, OrderStatus status);
    
    /**
     * Count orders for a user after a certain date, excluding cancelled orders
     */
    long countByUserIdAndCreatedAtAfterAndStatusNot(ObjectId userId, LocalDateTime after, OrderStatus excludeStatus);
    
    /**
     * Find orders for a user after a certain date, excluding a specific status
     */
    List<Order> findByUserIdAndCreatedAtAfterAndStatusNot(ObjectId userId, LocalDateTime after, OrderStatus excludeStatus);
}
