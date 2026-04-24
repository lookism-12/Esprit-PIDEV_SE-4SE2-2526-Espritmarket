package esprit_market.repository.notificationRepository;

import esprit_market.Enum.notificationEnum.QueuedNotificationStatus;
import esprit_market.entity.notification.QueuedNotification;
import esprit_market.entity.user.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QueuedNotificationRepository extends MongoRepository<QueuedNotification, ObjectId> {

    /** All queued (pending) notifications for a user, ordered FIFO */
    List<QueuedNotification> findByUserAndStatusOrderByCreatedAtAsc(User user, QueuedNotificationStatus status);

    /** Used by the scheduler to find all users that have pending items */
    List<QueuedNotification> findByStatus(QueuedNotificationStatus status);
}
