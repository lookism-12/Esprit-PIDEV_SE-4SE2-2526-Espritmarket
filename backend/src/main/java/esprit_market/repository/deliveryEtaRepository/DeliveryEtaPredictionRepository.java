package esprit_market.repository.deliveryEtaRepository;

import esprit_market.entity.deliveryEta.DeliveryEtaPrediction;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryEtaPredictionRepository extends MongoRepository<DeliveryEtaPrediction, ObjectId> {
    Optional<DeliveryEtaPrediction> findFirstByDeliveryIdOrderByCreatedAtDesc(ObjectId deliveryId);
    List<DeliveryEtaPrediction> findByDeliveryIdOrderByCreatedAtDesc(ObjectId deliveryId);
}
