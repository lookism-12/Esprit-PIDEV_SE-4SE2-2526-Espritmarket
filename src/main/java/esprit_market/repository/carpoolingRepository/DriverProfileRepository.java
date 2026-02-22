package esprit_market.repository.carpoolingRepository;

import esprit_market.entity.carpooling.DriverProfile;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DriverProfileRepository extends MongoRepository<DriverProfile, ObjectId> {
}
