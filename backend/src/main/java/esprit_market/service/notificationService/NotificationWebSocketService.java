package esprit_market.service.notificationService;

import esprit_market.dto.notification.NotificationDTO;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Pushes new notifications to the connected user over WebSocket.
 * Topic: /topic/notifications/{userId}
 */
@Service
@RequiredArgsConstructor
public class NotificationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void pushToUser(ObjectId userId, NotificationDTO dto) {
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + userId.toHexString(),
                dto
        );
    }
}
