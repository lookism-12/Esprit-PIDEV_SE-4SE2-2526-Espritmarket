package esprit_market.service.notificationService;

import esprit_market.entity.notification.Notification;
import esprit_market.repository.notificationRepository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepo;

    public List<Notification> findAll() {
        return notificationRepo.findAll();
    }

    public Notification notifyUsers(List<ObjectId> userIds, String title, String description) {
        Notification notification = Notification.builder()
                .userIds(userIds)
                .title(title)
                .description(description)
                .build();
        return notificationRepo.save(notification);
    }
}
