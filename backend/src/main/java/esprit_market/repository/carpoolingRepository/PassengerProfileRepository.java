package esprit_market.repository.carpoolingRepository;

import esprit_market.entity.carpooling.PassengerProfile;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PassengerProfileRepository extends MongoRepository<PassengerProfile, ObjectId> {

    Optional<PassengerProfile> findByUserId(ObjectId userId);

    boolean existsByUserId(ObjectId userId);
}
