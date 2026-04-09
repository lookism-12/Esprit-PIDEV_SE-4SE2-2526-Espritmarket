package esprit_market.repository.carpoolingRepository;

import esprit_market.entity.carpooling.DriverProfile;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DriverProfileRepository extends MongoRepository<DriverProfile, ObjectId> {

    Optional<DriverProfile> findByUserId(ObjectId userId);

    boolean existsByUserId(ObjectId userId);

    long countByIsVerifiedFalse();
}
