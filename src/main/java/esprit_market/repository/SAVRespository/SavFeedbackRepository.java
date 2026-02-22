package esprit_market.repository.SAVRespository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.SAV.SavFeedback;

@Repository
public interface SavFeedbackRepository extends MongoRepository<SavFeedback, ObjectId> {
}
