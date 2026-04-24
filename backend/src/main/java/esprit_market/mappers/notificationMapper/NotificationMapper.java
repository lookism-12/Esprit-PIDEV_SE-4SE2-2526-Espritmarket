package esprit_market.mappers.notificationMapper;

import esprit_market.dto.notification.NotificationDTO;
import esprit_market.entity.notification.Notification;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationDTO toDTO(Notification n) {
        if (n == null) return null;

        // Resolve display name: prefer denormalized field, fall back to legacy DBRef
        String displayName = n.getUserFullName();
        if ((displayName == null || displayName.isBlank()) && n.getUser() != null) {
            try {
                displayName = n.getUser().getFirstName() + " " + n.getUser().getLastName();
            } catch (Exception ignored) {}
        }

        return NotificationDTO.builder()
                .id(n.getId() != null ? n.getId().toHexString() : null)
                .userFullName(displayName)
                .title(n.getTitle())
                .description(n.getDescription())
                .type(n.getType())
                .linkedObjectId(n.getLinkedObjectId())
                .read(n.isRead())
                .isStarred(n.isStarred())
                .isFollowed(n.isFollowed())
                .notification_status(n.isNotificationStatus())
                .createdAt(n.getCreatedAt())
                .build();
    }

    public Notification toEntity(NotificationDTO dto) {
        if (dto == null) return null;
        return Notification.builder()
                .id(dto.getId() != null ? new ObjectId(dto.getId()) : null)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type(dto.getType())
                .linkedObjectId(dto.getLinkedObjectId())
                .read(dto.isRead())
                .isStarred(dto.isStarred())
                .isFollowed(dto.isFollowed())
                .notificationStatus(dto.isNotification_status())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}
