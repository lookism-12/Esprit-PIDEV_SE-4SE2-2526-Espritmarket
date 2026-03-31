package esprit_market.modules.market.dto.notification;

import esprit_market.modules.market.enums.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String title,
        String message,
        NotificationType type,
        boolean read,
        boolean active,
        LocalDateTime createdAt
) {
}
