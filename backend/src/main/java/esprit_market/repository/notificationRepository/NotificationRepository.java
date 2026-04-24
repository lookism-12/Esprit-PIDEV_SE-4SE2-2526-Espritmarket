package esprit_market.repository.notificationRepository;

import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.entity.notification.Notification;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, ObjectId> {

    // ── New format: userId field (plain ObjectId) ──────────────────────────
    List<Notification> findByUserId(ObjectId userId);
    List<Notification> findByUserIdAndRead(ObjectId userId, boolean read);
    List<Notification> findByUserIdAndNotificationStatusTrue(ObjectId userId);
    List<Notification> findByUserIdAndNotificationStatusTrueAndRead(ObjectId userId, boolean read);

    List<Notification> findByType(NotificationType type);

    // ── Dual-format queries: match EITHER userId OR old user.$id DBRef ─────

    @Query("{ '$and': [ { 'notification_status': true }, { '$or': [ { 'userId': ?0 }, { 'user.$id': ?0 } ] } ] }")
    List<Notification> findActiveByUserIdOrLegacyUser(ObjectId userId);

    @Query("{ '$and': [ { 'notification_status': true }, { 'read': false }, { '$or': [ { 'userId': ?0 }, { 'user.$id': ?0 } ] } ] }")
    List<Notification> findActiveUnreadByUserIdOrLegacyUser(ObjectId userId);
}
