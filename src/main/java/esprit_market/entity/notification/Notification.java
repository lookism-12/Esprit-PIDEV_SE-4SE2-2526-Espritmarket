package esprit_market.entity.notification;

import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.entity.user.User;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private ObjectId id;

    @DBRef
    private User user; // destinataire (receiver) — null = broadcast global (ex: Black Friday,
                       // promotions)

    private String title;
    private String description;

    private NotificationType type; // INTERNAL_NOTIFICATION ou EXTERNAL_NOTIFICATION

    private String linkedObjectId; // ID de l'objet lié (ex: negotiationId, eventId, etc.)

    private boolean read;

    private LocalDateTime createdAt;
}