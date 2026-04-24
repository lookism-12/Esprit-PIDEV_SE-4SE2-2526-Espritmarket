package esprit_market.entity.notification;

import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.Enum.notificationEnum.QueuedNotificationStatus;
import esprit_market.entity.user.User;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Holds notifications that were triggered while a user's focus mode was active.
 * Once focus mode ends, the scheduler flushes these in FIFO order (createdAt ASC).
 */
@Document(collection = "queued_notifications")
@CompoundIndex(name = "user_status_idx", def = "{'user.$id': 1, 'status': 1}")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueuedNotification {

    @Id
    private ObjectId id;

    @DBRef
    private User user;

    private String title;
    private String description;
    private NotificationType type;
    private String linkedObjectId;

    @Builder.Default
    private QueuedNotificationStatus status = QueuedNotificationStatus.QUEUED;

    /** When the notification was originally triggered — used for FIFO ordering */
    private LocalDateTime createdAt;

    /** When the notification was flushed and delivered */
    private LocalDateTime deliveredAt;
}
