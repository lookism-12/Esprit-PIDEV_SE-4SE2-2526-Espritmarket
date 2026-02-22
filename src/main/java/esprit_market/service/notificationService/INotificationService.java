package esprit_market.service.notificationService;

import esprit_market.entity.notification.Notification;

import java.util.List;

public interface INotificationService {
    List<Notification> findAllExternal();
}
