package esprit_market.dto.notification;

import esprit_market.Enum.notificationEnum.NotificationType;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private String id;
    private String userFullName; // destinataire (display only)
    private String title;
    private String description;
    private NotificationType type;
    private String linkedObjectId;
    private boolean read;
    private boolean notification_status; // true = active, false = deactivated
    private LocalDateTime createdAt;
}
