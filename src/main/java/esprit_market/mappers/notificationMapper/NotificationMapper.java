package esprit_market.mappers.notificationMapper;

import esprit_market.dto.notification.NotificationDTO;
import esprit_market.entity.notification.Notification;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationDTO toDTO(Notification n) {
        if (n == null)
            return null;
        return NotificationDTO.builder()
                .id(n.getId() != null ? n.getId().toHexString() : null)
                // @DBRef résolu automatiquement → on expose juste ce qu'on veut
                .userFullName(n.getUser() != null
                        ? n.getUser().getFirstName() + " " + n.getUser().getLastName()
                        : null)
                .title(n.getTitle())
                .description(n.getDescription())
                .type(n.getType())
                .linkedObjectId(n.getLinkedObjectId())
                .read(n.isRead())
                .notification_status(n.isNotificationStatus())
                .createdAt(n.getCreatedAt())
                .build();
    }

    public Notification toEntity(NotificationDTO dto) {
        if (dto == null)
            return null;
        return Notification.builder()
                .id(dto.getId() != null ? new ObjectId(dto.getId()) : null)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type(dto.getType())
                .linkedObjectId(dto.getLinkedObjectId())
                .read(dto.isRead())
                .notificationStatus(dto.isNotification_status())
                .createdAt(dto.getCreatedAt())
                .build();
    }
}