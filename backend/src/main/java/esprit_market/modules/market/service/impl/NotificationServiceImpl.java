package esprit_market.modules.market.service.impl;

import esprit_market.config.Exceptions;
import esprit_market.modules.market.dto.notification.NotificationResponse;
import esprit_market.modules.market.entity.Notification;
import esprit_market.modules.market.enums.NotificationType;
import esprit_market.modules.market.enums.UserRole;
import esprit_market.modules.market.mapper.MarketMapper;
import esprit_market.modules.market.repository.MarketNotificationJpaRepository;
import esprit_market.modules.market.repository.MarketUserJpaRepository;
import esprit_market.modules.market.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {
    private final MarketNotificationJpaRepository notificationRepository;
    private final MarketUserJpaRepository marketUserRepository;
    private final MarketMapper mapper;

    @Override
    public NotificationResponse createNotification(UUID userId, String title, String message, NotificationType type) {
        var user = marketUserRepository.findById(userId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("User not found"));

        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .read(false)
                .active(true)
                .createdAt(LocalDateTime.now())
                .user(user)
                .build();

        return mapper.toNotificationResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(UUID userId, UUID actorId, UserRole actorRole) {
        if (!actorId.equals(userId) && actorRole != UserRole.ADMIN) {
            throw new Exceptions.AccessDeniedException("Only owner or admin can view notifications");
        }
        return notificationRepository.findByUserIdAndActiveTrueOrderByCreatedAtDesc(userId)
                .stream()
                .map(mapper::toNotificationResponse)
                .toList();
    }

    @Override
    public NotificationResponse markAsRead(UUID notificationId, UUID actorId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Notification not found"));
        if (!notification.getUser().getId().equals(actorId)) {
            throw new Exceptions.AccessDeniedException("Only owner can mark notification as read");
        }
        notification.setRead(true);
        return mapper.toNotificationResponse(notificationRepository.save(notification));
    }

    @Override
    public void deactivate(UUID notificationId, UUID actorId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Notification not found"));
        if (!notification.getUser().getId().equals(actorId)) {
            throw new Exceptions.AccessDeniedException("Only owner can deactivate notification");
        }
        notification.setActive(false);
        notificationRepository.save(notification);
    }

    @Override
    public void hardDelete(UUID notificationId, UserRole actorRole) {
        if (actorRole != UserRole.ADMIN) {
            throw new Exceptions.AccessDeniedException("Only admin can hard delete notifications");
        }
        notificationRepository.deleteById(notificationId);
    }
}
