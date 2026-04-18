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
    
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    
    List<Order> findByStatus(OrderStatus status);
    
    List<Order> findByStatusIn(List<OrderStatus> statuses);
    
    Optional<Order> findByOrderNumber(String orderNumber);
    
    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    List<Order> findByUserAndStatus(User user, OrderStatus status);
    
    long countByStatus(OrderStatus status);
    
    long countByUser(User user);
    List<Order> findByStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime time);
}
