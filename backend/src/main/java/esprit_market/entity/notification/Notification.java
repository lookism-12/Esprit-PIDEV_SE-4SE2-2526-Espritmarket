package esprit_market.entity.notification;

import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.entity.user.User;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private ObjectId id;

    /** New format — plain ObjectId, no N+1 */
    @Indexed
    private ObjectId userId;

    /** Denormalized display name */
    private String userFullName;

    /**
     * Legacy field — kept for backward compat with old documents.
     * New documents do NOT set this; migration removes it.
     * We keep it here so Spring Data can read old docs without crashing.
     */
    @DBRef(lazy = true)
    private User user;

    private String title;
    private String description;

    private NotificationType type;

    private String linkedObjectId;

    private boolean read;
    private boolean isStarred;
    private boolean isFollowed;

    @Builder.Default
    @Field("notification_status")
    private boolean notificationStatus = true;

    private LocalDateTime createdAt;

    /** Returns the effective userId, falling back to the legacy DBRef if needed */
    public ObjectId effectiveUserId() {
        if (userId != null) return userId;
        try { return user != null ? user.getId() : null; } catch (Exception e) { return null; }
    }
}
