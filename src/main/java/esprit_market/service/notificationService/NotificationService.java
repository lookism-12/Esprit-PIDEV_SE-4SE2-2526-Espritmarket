package esprit_market.service.notificationService;

import esprit_market.dto.notification.NotificationDTO;
import esprit_market.entity.notification.Notification;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.entity.user.User;
import esprit_market.mappers.notificationMapper.NotificationMapper;
import esprit_market.repository.notificationRepository.NotificationRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService implements INotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final UserRepository userRepository;

    private User getUser(ObjectId id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + id));
    }

    @Override
    public NotificationDTO createNotification(NotificationDTO dto, ObjectId userId) {
        User user = getUser(userId);
        Notification notification = notificationMapper.toEntity(dto);
        notification.setUser(user); // @DBRef résolu depuis JWT
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        return notificationMapper.toDTO(notificationRepository.save(notification));
    }

    @Override
    public NotificationDTO getNotificationById(ObjectId id) {
        return notificationMapper.toDTO(
                notificationRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Notification introuvable : " + id)));
    }

    @Override
    public List<NotificationDTO> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getMyNotifications(ObjectId userId) {
        User user = getUser(userId);
        return notificationRepository.findByUser(user).stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getMyUnreadNotifications(ObjectId userId) {
        User user = getUser(userId);
        return notificationRepository.findByUserAndRead(user, false).stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getNotificationsByType(NotificationType type) {
        return notificationRepository.findByType(type).stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public NotificationDTO markAsRead(ObjectId id, ObjectId userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable : " + id));

        // Security check: only recipient or ADMIN can mark as read
        if (notification.getUser() != null && !notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Accès refusé : cette notification ne vous appartient pas.");
        }

        notification.setRead(true);
        return notificationMapper.toDTO(notificationRepository.save(notification));
    }

    @Override
    public NotificationDTO broadcast(NotificationDTO dto) {
        // user = null → notification globale (Black Friday, promotions...)
        Notification notification = notificationMapper.toEntity(dto);
        notification.setUser(null);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        return notificationMapper.toDTO(notificationRepository.save(notification));
    }

    @Override
    public void deleteNotification(ObjectId id, ObjectId userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification introuvable : " + id));

        // Security check: only recipient or ADMIN can delete
        if (notification.getUser() != null && !notification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Accès refusé : vous ne pouvez pas supprimer cette notification.");
        }

        notificationRepository.deleteById(id);
    }

    @Override
    public void sendNotification(User user, String title, String description, NotificationType type,
            String linkedObjectId) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .description(description)
                .type(type)
                .linkedObjectId(linkedObjectId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }
}