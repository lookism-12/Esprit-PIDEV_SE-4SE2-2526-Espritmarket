package esprit_market.repository;

import esprit_market.entity.PassengerProfile;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PassengerProfileRepository extends MongoRepository<PassengerProfile, ObjectId> {
}
