package esprit_market.modules.market.controller;

import esprit_market.modules.market.dto.notification.NotificationResponse;
import esprit_market.modules.market.service.CurrentActorService;
import esprit_market.modules.market.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController("marketNotificationController")
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final CurrentActorService currentActorService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationResponse>> getByUser(
            @PathVariable UUID userId,
            @RequestHeader("X-User-Id") String actorIdHeader,
            @RequestHeader("X-User-Role") String roleHeader
    ) {
        return ResponseEntity.ok(notificationService.getUserNotifications(
                userId,
                currentActorService.parseUserId(actorIdHeader),
                currentActorService.parseRole(roleHeader)
        ));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String actorIdHeader
    ) {
        return ResponseEntity.ok(notificationService.markAsRead(id, currentActorService.parseUserId(actorIdHeader)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String actorIdHeader
    ) {
        notificationService.deactivate(id, currentActorService.parseUserId(actorIdHeader));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> hardDelete(
            @PathVariable UUID id,
            @RequestHeader("X-User-Role") String roleHeader
    ) {
        notificationService.hardDelete(id, currentActorService.parseRole(roleHeader));
        return ResponseEntity.noContent().build();
    }
}
