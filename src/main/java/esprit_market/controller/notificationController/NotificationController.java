package esprit_market.controller.notificationController;

import esprit_market.entity.notification.Notification;
import esprit_market.service.notificationService.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;

    @GetMapping
    public List<Notification> getAll() {
        return service.findAll();
    }
}
