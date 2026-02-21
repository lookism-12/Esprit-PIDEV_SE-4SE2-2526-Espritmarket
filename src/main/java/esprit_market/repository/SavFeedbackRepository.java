package esprit_market.repository;

import esprit_market.entity.SavFeedback;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SavFeedbackRepository extends MongoRepository<SavFeedback, ObjectId> {
}
