package esprit_market.repository.carpoolingRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.carpooling.Vehicle;

@Repository
public interface VehicleRepository extends MongoRepository<Vehicle, ObjectId> {
}
