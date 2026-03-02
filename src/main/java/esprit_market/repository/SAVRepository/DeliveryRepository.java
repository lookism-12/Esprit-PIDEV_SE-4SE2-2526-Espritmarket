package esprit_market.repository.SAVRepository;

import esprit_market.entity.SAV.Delivery;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryRepository extends MongoRepository<Delivery, ObjectId> {
    List<Delivery> findByUserId(ObjectId userId);

    List<Delivery> findByCartId(ObjectId cartId);
}
