package esprit_market.repository.SAVRepository;

import esprit_market.entity.SAV.Delivery;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends MongoRepository<Delivery, ObjectId> {
    List<Delivery> findByUserId(ObjectId userId);
    List<Delivery> findByUserIdOrPendingDriverId(ObjectId userId, ObjectId pendingDriverId);
    List<Delivery> findByCartId(ObjectId cartId);
    Optional<Delivery> findByOrderId(ObjectId orderId);
    List<Delivery> findByStatus(String status);
}
