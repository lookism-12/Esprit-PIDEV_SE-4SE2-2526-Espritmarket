package esprit_market.modules.market.service;

import esprit_market.modules.market.entity.MarketUser;
import esprit_market.modules.market.entity.Notification;
import esprit_market.modules.market.enums.NotificationType;
import esprit_market.modules.market.enums.UserRole;
import esprit_market.modules.market.mapper.MarketMapper;
import esprit_market.modules.market.repository.MarketNotificationJpaRepository;
import esprit_market.modules.market.repository.MarketUserJpaRepository;
import esprit_market.modules.market.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {
    @Mock private MarketNotificationJpaRepository notificationRepository;
    @Mock private MarketUserJpaRepository marketUserRepository;
    @Spy private MarketMapper mapper;
    @InjectMocks private NotificationServiceImpl notificationService;

    @Test
    void markAsRead_updatesReadFlag() {
        UUID notificationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        MarketUser user = MarketUser.builder().id(userId).fullName("User").role(UserRole.USER).build();
        Notification notification = Notification.builder()
                .id(notificationId)
                .user(user)
                .title("T")
                .message("M")
                .type(NotificationType.SYSTEM)
                .active(true)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = notificationService.markAsRead(notificationId, userId);
        assertTrue(result.read());
    }

    @Test
    void deactivate_setsInactive() {
        UUID notificationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        MarketUser user = MarketUser.builder().id(userId).fullName("User").role(UserRole.USER).build();
        Notification notification = Notification.builder()
                .id(notificationId).user(user).title("T").message("M").type(NotificationType.SYSTEM)
                .active(true).read(false).createdAt(LocalDateTime.now()).build();
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification));

        notificationService.deactivate(notificationId, userId);
        verify(notificationRepository).save(argThat(n -> !n.isActive()));
    }
}
