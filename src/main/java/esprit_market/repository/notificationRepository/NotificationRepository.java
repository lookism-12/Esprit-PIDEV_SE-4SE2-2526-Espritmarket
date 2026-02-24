package esprit_market.repository.notificationRepository;

import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.entity.user.User;
import esprit_market.entity.notification.Notification;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, ObjectId> {
    List<Notification> findByUser(User user);

    List<Notification> findByUserAndRead(User user, boolean read);

    List<Notification> findByType(NotificationType type);
}
