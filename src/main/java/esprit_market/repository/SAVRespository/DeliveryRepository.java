package esprit_market.repository.SAVRespository;

import esprit_market.entity.SAV.Delivery;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DeliveryRepository extends MongoRepository<Delivery, ObjectId> {
}
