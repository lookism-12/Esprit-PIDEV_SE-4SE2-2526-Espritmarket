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
    
    // Get SAV claims by user ID
    List<SavFeedback> findByUserIdAndType(ObjectId userId, String type);
    
    // Get SAV claims by status
    List<SavFeedback> findByTypeAndStatus(String type, String status);
    
    // Get unread SAV claims
    List<SavFeedback> findByTypeAndReadByAdminFalse(String type);
    
    // Get feedbacks by list of cartItemIds (OrderItems) and type
    List<SavFeedback> findByCartItemIdInAndType(List<ObjectId> cartItemIds, String type);
}
