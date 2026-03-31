package esprit_market.modules.market.service;

import esprit_market.modules.market.dto.notification.NotificationResponse;
import esprit_market.modules.market.enums.NotificationType;
import esprit_market.modules.market.enums.UserRole;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    NotificationResponse createNotification(UUID userId, String title, String message, NotificationType type);
    List<NotificationResponse> getUserNotifications(UUID userId, UUID actorId, UserRole actorRole);
    NotificationResponse markAsRead(UUID notificationId, UUID actorId);
    void deactivate(UUID notificationId, UUID actorId);
    void hardDelete(UUID notificationId, UserRole actorRole);
}
