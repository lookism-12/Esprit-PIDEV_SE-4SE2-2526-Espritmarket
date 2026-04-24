package esprit_market.notification;

import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.Enum.notificationEnum.QueuedNotificationStatus;
import esprit_market.entity.notification.NotificationSettings;
import esprit_market.entity.notification.QueuedNotification;
import esprit_market.entity.user.User;
import esprit_market.repository.notificationRepository.NotificationRepository;
import esprit_market.repository.notificationRepository.QueuedNotificationRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.NotificationService;
import esprit_market.service.notificationService.NotificationSettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FocusModeQueueTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private QueuedNotificationRepository queuedNotificationRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationSettingsService notificationSettingsService;

    @InjectMocks private NotificationService notificationService;

    @Captor private ArgumentCaptor<QueuedNotification> queuedCaptor;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("user@test.com")
                .notificationsEnabled(true)
                .notificationSettings(NotificationSettings.builder()
                        .focusModeEnabled(true)
                        .focusModeStart(LocalTime.of(21, 0))
                        .focusModeEnd(LocalTime.of(5, 0))
                        .internalNotificationsEnabled(true)
                        .externalNotificationsEnabled(true)
                        .build())
                .build();
    }

    // ─── Queuing during focus mode ────────────────────────────────

    @Test
    @DisplayName("sendNotification during focus mode → saves QueuedNotification, not Notification")
    void duringFocusMode_queuesInsteadOfSends() {
        when(notificationSettingsService.isInFocusWindow(eq(user), any(LocalTime.class))).thenReturn(true);

        notificationService.sendNotification(user, "Hello", "Body",
                NotificationType.INTERNAL_NOTIFICATION, null);

        verify(queuedNotificationRepository).save(queuedCaptor.capture());
        verify(notificationRepository, never()).save(any());

        QueuedNotification saved = queuedCaptor.getValue();
        assertThat(saved.getStatus()).isEqualTo(QueuedNotificationStatus.QUEUED);
        assertThat(saved.getTitle()).isEqualTo("Hello");
        assertThat(saved.getUser()).isEqualTo(user);
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    @Test
    @DisplayName("sendNotification outside focus mode → saves Notification directly")
    void outsideFocusMode_sendsDirectly() {
        when(notificationSettingsService.isInFocusWindow(eq(user), any(LocalTime.class))).thenReturn(false);
        when(notificationSettingsService.canSendNotification(eq(user), eq("internal"), any(LocalTime.class))).thenReturn(true);

        notificationService.sendNotification(user, "Hello", "Body",
                NotificationType.INTERNAL_NOTIFICATION, null);

        verify(notificationRepository).save(any());
        verify(queuedNotificationRepository, never()).save(any());
    }

    // ─── FIFO flush ───────────────────────────────────────────────

    @Test
    @DisplayName("flushQueueForUser delivers all queued items in FIFO order and marks them DELIVERED")
    void flushQueue_deliversFifoAndMarksDelivered() {
        QueuedNotification first = queued("First", LocalDateTime.now().minusMinutes(10));
        QueuedNotification second = queued("Second", LocalDateTime.now().minusMinutes(5));
        QueuedNotification third = queued("Third", LocalDateTime.now().minusMinutes(1));

        when(queuedNotificationRepository.findByUserAndStatusOrderByCreatedAtAsc(user, QueuedNotificationStatus.QUEUED))
                .thenReturn(List.of(first, second, third));

        notificationService.flushQueueForUser(user);

        // All three persisted as real notifications
        verify(notificationRepository, times(3)).save(any());

        // All three marked DELIVERED with a deliveredAt timestamp
        verify(queuedNotificationRepository, times(3)).save(queuedCaptor.capture());
        List<QueuedNotification> updated = queuedCaptor.getAllValues();
        assertThat(updated).allMatch(q -> q.getStatus() == QueuedNotificationStatus.DELIVERED);
        assertThat(updated).allMatch(q -> q.getDeliveredAt() != null);
    }

    @Test
    @DisplayName("flushQueueForUser with empty queue → no-op")
    void flushQueue_emptyQueue_noOp() {
        when(queuedNotificationRepository.findByUserAndStatusOrderByCreatedAtAsc(user, QueuedNotificationStatus.QUEUED))
                .thenReturn(List.of());

        notificationService.flushQueueForUser(user);

        verify(notificationRepository, never()).save(any());
        verify(queuedNotificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("No duplication: each queued item saved exactly once as Notification")
    void flushQueue_noDuplication() {
        QueuedNotification item = queued("Only one", LocalDateTime.now().minusMinutes(3));
        when(queuedNotificationRepository.findByUserAndStatusOrderByCreatedAtAsc(user, QueuedNotificationStatus.QUEUED))
                .thenReturn(List.of(item));

        notificationService.flushQueueForUser(user);

        verify(notificationRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Master toggle off → notification not queued and not sent")
    void masterToggleOff_neitherQueuedNorSent() {
        user.setNotificationsEnabled(false);

        notificationService.sendNotification(user, "Hello", "Body",
                NotificationType.INTERNAL_NOTIFICATION, null);

        verify(queuedNotificationRepository, never()).save(any());
        verify(notificationRepository, never()).save(any());
    }

    // ─── Helper ───────────────────────────────────────────────────

    private QueuedNotification queued(String title, LocalDateTime createdAt) {
        return QueuedNotification.builder()
                .user(user)
                .title(title)
                .description("desc")
                .type(NotificationType.INTERNAL_NOTIFICATION)
                .status(QueuedNotificationStatus.QUEUED)
                .createdAt(createdAt)
                .build();
    }
}
