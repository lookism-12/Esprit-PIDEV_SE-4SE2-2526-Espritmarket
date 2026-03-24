package esprit_market.repository.carpoolingRepository;

import esprit_market.entity.carpooling.Vehicle;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehicleRepository extends MongoRepository<Vehicle, ObjectId> {

    List<Vehicle> findByDriverProfileId(ObjectId driverProfileId);

    boolean existsByIdAndDriverProfileId(ObjectId vehicleId, ObjectId driverProfileId);
}
