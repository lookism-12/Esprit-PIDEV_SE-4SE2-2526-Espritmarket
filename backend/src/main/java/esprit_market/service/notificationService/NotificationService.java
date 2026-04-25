package esprit_market.service.notificationService;

import esprit_market.config.Exceptions.AccessDeniedException;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.notification.NotificationDTO;
import esprit_market.entity.notification.Notification;
import esprit_market.entity.notification.QueuedNotification;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.Enum.notificationEnum.QueuedNotificationStatus;
import esprit_market.entity.user.User;
import esprit_market.mappers.notificationMapper.NotificationMapper;
import esprit_market.repository.notificationRepository.NotificationRepository;
import esprit_market.repository.notificationRepository.QueuedNotificationRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService implements INotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final UserRepository userRepository;
    private final NotificationSettingsService notificationSettingsService;
    private final QueuedNotificationRepository queuedNotificationRepository;
    private final NotificationWebSocketService notificationWebSocketService;

    private User getUser(ObjectId id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toHexString()));
    }

    private String fullName(User u) {
        return (u.getFirstName() != null ? u.getFirstName() : "") +
               " " +
               (u.getLastName() != null ? u.getLastName() : "");
    }

    // ─────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public NotificationDTO createNotification(NotificationDTO dto, ObjectId userId) {
        log.info("Creating notification for user: {}", userId);
        User user = getUser(userId);
        Notification notification = notificationMapper.toEntity(dto);
        notification.setUserId(user.getId());
        notification.setUserFullName(fullName(user));
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        return notificationMapper.toDTO(notificationRepository.save(notification));
    }

    @Override
    public NotificationDTO getNotificationById(ObjectId id) {
        return notificationMapper.toDTO(
                notificationRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id.toHexString())));
    }

    @Override
    public List<NotificationDTO> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getMyNotifications(ObjectId userId) {
        return notificationRepository.findActiveByUserIdOrLegacyUser(userId).stream()
                .map(notificationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getMyUnreadNotifications(ObjectId userId) {
        return notificationRepository.findActiveUnreadByUserIdOrLegacyUser(userId).stream()
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
    @Transactional
    public NotificationDTO markAsRead(ObjectId id, ObjectId userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id.toHexString()));

        if (notification.effectiveUserId() != null && !notification.effectiveUserId().equals(userId)) {
            throw new AccessDeniedException("This notification does not belong to you");
        }

        notification.setRead(true);
        return notificationMapper.toDTO(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public NotificationDTO broadcast(NotificationDTO dto) {
        log.info("Broadcasting notification: {}", dto.getTitle());
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
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id.toHexString()));

        if (notification.effectiveUserId() != null && !notification.effectiveUserId().equals(userId)) {
            throw new AccessDeniedException("You cannot deactivate this notification");
        }

        notification.setNotificationStatus(false);
        return notificationMapper.toDTO(notificationRepository.save(notification));
    }

    // ─────────────────────────────────────────────────────────────
    // Send / Queue
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void sendNotification(User user, String title, String description,
            NotificationType type, String linkedObjectId) {

        if (!user.isNotificationsEnabled()) return;

        String category = switch (type) {
            case INTERNAL_NOTIFICATION -> "internal";
            case EXTERNAL_NOTIFICATION -> "external";
            default -> "internal";
        };

        LocalTime now = LocalTime.now();

        if (notificationSettingsService.isInFocusWindow(user, now)) {
            log.debug("Focus mode: queuing notification for {}", user.getEmail());
            queuedNotificationRepository.save(QueuedNotification.builder()
                    .user(user)
                    .title(title)
                    .description(description)
                    .type(type)
                    .linkedObjectId(linkedObjectId)
                    .status(QueuedNotificationStatus.QUEUED)
                    .createdAt(LocalDateTime.now())
                    .build());
            return;
        }

        if (!notificationSettingsService.canSendNotification(user, category, now)) return;

        persistNotification(user, title, description, type, linkedObjectId);
    }

    @Transactional
    public void flushQueueForUser(User user) {
        List<QueuedNotification> pending = queuedNotificationRepository
                .findByUserAndStatusOrderByCreatedAtAsc(user, QueuedNotificationStatus.QUEUED);

        if (pending.isEmpty()) return;

        log.info("Flushing {} queued notifications for {}", pending.size(), user.getEmail());
        for (QueuedNotification q : pending) {
            persistNotification(user, q.getTitle(), q.getDescription(), q.getType(), q.getLinkedObjectId());
            q.setStatus(QueuedNotificationStatus.DELIVERED);
            q.setDeliveredAt(LocalDateTime.now());
            queuedNotificationRepository.save(q);
        }
    }

    private void persistNotification(User user, String title, String description,
            NotificationType type, String linkedObjectId) {
        Notification saved = notificationRepository.save(Notification.builder()
                .userId(user.getId())
                .userFullName(fullName(user))
                .title(title)
                .description(description)
                .type(type)
                .linkedObjectId(linkedObjectId)
                .read(false)
                .notificationStatus(true)
                .createdAt(LocalDateTime.now())
                .build());

        // Push real-time over WebSocket
        notificationWebSocketService.pushToUser(user.getId(), notificationMapper.toDTO(saved));
    }

    @Transactional
    public void notifyUsers(List<ObjectId> userIds, String title, String description) {
        for (ObjectId uid : userIds) {
            userRepository.findById(uid).ifPresent(u ->
                sendNotification(u, title, description, NotificationType.RIDE_UPDATE, null));
        }
    }

    @Override
    @Transactional
    public void notifyAllAdmins(String title, String description, NotificationType type, String linkedObjectId) {
        userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null &&
                        u.getRoles().contains(esprit_market.Enum.userEnum.Role.ADMIN))
                .forEach(admin -> sendNotification(admin, title, description, type, linkedObjectId));
    }

    @Override
    @Transactional
    public NotificationDTO toggleStar(ObjectId id, ObjectId userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id.toHexString()));
        if (n.effectiveUserId() != null && !n.effectiveUserId().equals(userId)) throw new AccessDeniedException("Access denied");
        n.setStarred(!n.isStarred());
        return notificationMapper.toDTO(notificationRepository.save(n));
    }

    @Override
    @Transactional
    public NotificationDTO toggleFollow(ObjectId id, ObjectId userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id.toHexString()));
        if (n.effectiveUserId() != null && !n.effectiveUserId().equals(userId)) throw new AccessDeniedException("Access denied");
        n.setFollowed(!n.isFollowed());
        return notificationMapper.toDTO(notificationRepository.save(n));
    }

    @Override
    @Transactional
    public void bulkMarkAsRead(List<ObjectId> ids, ObjectId userId) {
        List<Notification> list = notificationRepository.findAllById(ids);
        list.stream()
                .filter(n -> n.effectiveUserId() != null && n.effectiveUserId().equals(userId))
                .forEach(n -> n.setRead(true));
        notificationRepository.saveAll(list);
    }

    @Override
    @Transactional
    public void bulkDelete(List<ObjectId> ids, ObjectId userId) {
        List<Notification> list = notificationRepository.findAllById(ids);
        list.stream()
                .filter(n -> n.effectiveUserId() != null && n.effectiveUserId().equals(userId))
                .forEach(n -> n.setNotificationStatus(false));
        notificationRepository.saveAll(list);
    }

    @Override
    @Transactional
    public void bulkToggleStar(List<ObjectId> ids, boolean star, ObjectId userId) {
        List<Notification> list = notificationRepository.findAllById(ids);
        list.stream()
                .filter(n -> n.effectiveUserId() != null && n.effectiveUserId().equals(userId))
                .forEach(n -> n.setStarred(star));
        notificationRepository.saveAll(list);
    }

    // ─────────────────────────────────────────────────────────────
    // Coupon Broadcast Notification
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void notifyUsersAboutCoupon(ObjectId couponId, String couponCode, String shopName,
                                       String discountInfo, LocalDateTime expiryDate) {
        log.info("Broadcasting coupon notification: {} from shop: {}", couponCode, shopName);
        
        // Get all active customers (users who are not ADMIN or PROVIDER)
        List<User> customers = userRepository.findAll().stream()
                .filter(user -> user.getRoles() != null && 
                       !user.getRoles().contains(esprit_market.Enum.userEnum.Role.ADMIN) &&
                       !user.getRoles().contains(esprit_market.Enum.userEnum.Role.PROVIDER))
                .collect(Collectors.toList());
        
        log.info("Sending coupon notification to {} customers", customers.size());
        
        String title = "🎟️ New Coupon Available";
        String description = String.format("%s offers %s with code %s. Valid until %s",
                shopName, discountInfo, couponCode,
                expiryDate.toLocalDate().toString());
        
        for (User customer : customers) {
            if (!customer.isNotificationsEnabled()) {
                continue;
            }
            
            // Check focus mode and notification settings
            LocalTime now = LocalTime.now();
            if (notificationSettingsService.isInFocusWindow(customer, now)) {
                log.debug("Focus mode: queuing coupon notification for {}", customer.getEmail());
                queuedNotificationRepository.save(QueuedNotification.builder()
                        .user(customer)
                        .title(title)
                        .description(description)
                        .type(NotificationType.COUPON_ALERT)
                        .linkedObjectId(couponId.toHexString())
                        .status(QueuedNotificationStatus.QUEUED)
                        .createdAt(LocalDateTime.now())
                        .build());
                continue;
            }
            
            if (!notificationSettingsService.canSendNotification(customer, "external", now)) {
                continue;
            }
            
            // Persist notification with coupon metadata
            Notification saved = notificationRepository.save(Notification.builder()
                    .userId(customer.getId())
                    .userFullName(fullName(customer))
                    .title(title)
                    .description(description)
                    .type(NotificationType.COUPON_ALERT)
                    .linkedObjectId(couponId.toHexString())
                    .couponCode(couponCode)
                    .shopName(shopName)
                    .discountInfo(discountInfo)
                    .couponExpiryDate(expiryDate)
                    .read(false)
                    .notificationStatus(true)
                    .createdAt(LocalDateTime.now())
                    .build());
            
            // Push real-time over WebSocket
            notificationWebSocketService.pushToUser(customer.getId(), notificationMapper.toDTO(saved));
        }
        
        log.info("Coupon notification broadcast completed for coupon: {}", couponCode);
    }
}
