package esprit_market.repository;

import esprit_market.entity.ExternalNotification;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExternalNotificationRepository extends MongoRepository<ExternalNotification, ObjectId> {
}
