package esprit_market.repository.carpoolingRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.carpooling.RidePayment;

@Repository
public interface RidePaymentRepository extends MongoRepository<RidePayment, ObjectId> {
}
