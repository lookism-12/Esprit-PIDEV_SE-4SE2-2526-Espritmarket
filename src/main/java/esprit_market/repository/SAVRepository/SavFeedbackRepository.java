package esprit_market.repository.SAVRepository;

import esprit_market.entity.SAV.SavFeedback;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavFeedbackRepository extends MongoRepository<SavFeedback, ObjectId> {
    List<SavFeedback> findByCartItemId(ObjectId cartItemId);

    List<SavFeedback> findByType(String type);
}
