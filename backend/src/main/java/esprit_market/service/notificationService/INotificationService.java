package esprit_market.service.notificationService;

import esprit_market.dto.notification.NotificationDTO;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.entity.user.User;
import org.bson.types.ObjectId;

import java.util.List;

public interface INotificationService {

    NotificationDTO createNotification(NotificationDTO dto, ObjectId userId);

    NotificationDTO getNotificationById(ObjectId id);

    List<NotificationDTO> getAllNotifications();

    List<NotificationDTO> getMyNotifications(ObjectId userId);

    List<NotificationDTO> getMyUnreadNotifications(ObjectId userId);

    List<NotificationDTO> getNotificationsByType(NotificationType type);

    NotificationDTO markAsRead(ObjectId id, ObjectId userId);

    // Broadcast global — ADMIN seulement (ex: Black Friday)
    NotificationDTO broadcast(NotificationDTO dto);

    // Soft delete: deactivate notification instead of hard delete
    NotificationDTO deactivateNotification(ObjectId id, ObjectId userId);

    void sendNotification(User user, String title, String description, NotificationType type, String linkedObjectId);

    void notifyAllAdmins(String title, String description, NotificationType type, String linkedObjectId);

    NotificationDTO toggleStar(ObjectId id, ObjectId userId);
    NotificationDTO toggleFollow(ObjectId id, ObjectId userId);

    void bulkMarkAsRead(List<ObjectId> ids, ObjectId userId);
    void bulkDelete(List<ObjectId> ids, ObjectId userId);
    void bulkToggleStar(List<ObjectId> ids, boolean star, ObjectId userId);
}