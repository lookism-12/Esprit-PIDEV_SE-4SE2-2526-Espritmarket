package esprit_market.service.notificationService;

import esprit_market.entity.notification.Notification;
import esprit_market.repository.notificationRepository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepo;

    public List<Notification> findAll() {
        return notificationRepo.findAll();
    }
}
