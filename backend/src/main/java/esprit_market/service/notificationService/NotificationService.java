package esprit_market.service.notificationService;

import esprit_market.config.Exceptions.AccessDeniedException;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.notification.NotificationDTO;
import esprit_market.entity.notification.Notification;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.entity.user.User;
import esprit_market.mappers.notificationMapper.NotificationMapper;
import esprit_market.repository.notificationRepository.NotificationRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService implements INotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final UserRepository userRepository;

    private User getUser(ObjectId id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toHexString()));
    }

    @Override
    @Transactional
    public NotificationDTO createNotification(NotificationDTO dto, ObjectId userId) {
        log.info("Creating notification for user: {}", userId);
        User user = getUser(userId);
        Notification notification = notificationMapper.toEntity(dto);
        notification.setUser(user);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        return notificationMapper.toDTO(notificationRepository.save(notification));
    }

    @Override
    public NotificationDTO getNotificationById(ObjectId id) {
        log.debug("Fetching notification by id: {}", id);
        return notificationMapper.toDTO(
                notificationRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id.toHexString())));
    }

    @Override
    public List<NotificationDTO> getAllNotifications() {
        log.debug("Fetching all notifications");
        return notificationRepository.findAll().stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getMyNotifications(ObjectId userId) {
        log.debug("Fetching notifications for user: {}", userId);
        User user = getUser(userId);
        return notificationRepository.findByUserAndNotificationStatusTrue(user).stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getMyUnreadNotifications(ObjectId userId) {
        log.debug("Fetching unread notifications for user: {}", userId);
        User user = getUser(userId);
        return notificationRepository.findByUserAndNotificationStatusTrueAndRead(user, false).stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getNotificationsByType(NotificationType type) {
        log.debug("Fetching notifications by type: {}", type);
        return notificationRepository.findByType(type).stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationDTO markAsRead(ObjectId id, ObjectId userId) {
        log.info("Marking notification as read: {}", id);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id.toHexString()));

        if (notification.getUser() != null && !notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("This notification does not belong to you");
        }

        notification.setRead(true);
        return notificationMapper.toDTO(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public NotificationDTO broadcast(NotificationDTO dto) {
        log.info("Broadcasting notification to all users: {}", dto.getTitle());
        List<User> allUsers = userRepository.findAll();
        for (User user : allUsers) {
            sendNotification(user, dto.getTitle(), dto.getDescription(),
                    NotificationType.EXTERNAL_NOTIFICATION, null);
        }
        return dto;
    }

    @Override
    @Transactional
    public NotificationDTO deactivateNotification(ObjectId id, ObjectId userId) {
        log.info("Deactivating notification: {}", id);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id.toHexString()));

        if (notification.getUser() != null && !notification.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You cannot deactivate this notification");
        }

        // Soft delete: set notificationStatus to false instead of hard delete
        notification.setNotificationStatus(false);
        log.info("Notification deactivated (soft delete): {}", id);
        return notificationMapper.toDTO(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void sendNotification(User user, String title, String description, NotificationType type,
            String linkedObjectId) {
        if (!user.isNotificationsEnabled()) {
            log.debug("Notifications disabled for user: {}, skipping.", user.getEmail());
            return;
        }
        if (type == NotificationType.INTERNAL_NOTIFICATION && !user.isInternalNotificationsEnabled()) {
            log.debug("Internal notifications disabled for user: {}, skipping.", user.getEmail());
            return;
        }
        if (type == NotificationType.EXTERNAL_NOTIFICATION && !user.isExternalNotificationsEnabled()) {
            log.debug("External notifications disabled for user: {}, skipping.", user.getEmail());
            return;
        }
        log.debug("Sending notification to user: {}", user.getEmail());
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .description(description)
                .type(type)
                .linkedObjectId(linkedObjectId)
                .read(false)
                .notificationStatus(true)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void notifyUsers(List<ObjectId> userIds, String title, String description) {
        log.info("Notifying {} users with title: {}", userIds.size(), title);
        for (ObjectId userId : userIds) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                sendNotification(user, title, description, NotificationType.RIDE_UPDATE, null);
            }
        }
    }

    @Override
    @Transactional
    public void notifyAllAdmins(String title, String description, NotificationType type, String linkedObjectId) {
        log.info("Notifying all admins: {}", title);
        userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null &&
                        u.getRoles().contains(esprit_market.Enum.userEnum.Role.ADMIN))
                .forEach(admin -> sendNotification(admin, title, description, type, linkedObjectId));
    }
}