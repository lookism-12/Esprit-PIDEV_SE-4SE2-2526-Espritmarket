package esprit_market.service.notificationService;

import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.config.Exceptions.AccessDeniedException;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.notification.NotificationDTO;
import esprit_market.entity.notification.Notification;
import esprit_market.entity.user.User;
import esprit_market.mappers.notificationMapper.NotificationMapper;
import esprit_market.repository.notificationRepository.NotificationRepository;
import esprit_market.repository.userRepository.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Unit Tests")
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private NotificationMapper notificationMapper;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    // ── Shared fixtures ───────────────────────────────────────────────────────
    private ObjectId userId;
    private ObjectId notifId;
    private User user;
    private Notification notification;
    private NotificationDTO dto;

    @BeforeEach
    void setUp() {
        userId  = new ObjectId();
        notifId = new ObjectId();

        user = User.builder()
                .id(userId).firstName("Alice").lastName("Smith")
                .email("alice@test.com")
                .notificationsEnabled(true)
                .internalNotificationsEnabled(true)
                .externalNotificationsEnabled(true)
                .build();

        notification = Notification.builder()
                .id(notifId).user(user)
                .title("Test").description("Test body")
                .type(NotificationType.INTERNAL_NOTIFICATION)
                .read(false).notificationStatus(true)
                .createdAt(LocalDateTime.now())
                .build();

        dto = NotificationDTO.builder()
                .id(notifId.toHexString())
                .title("Test").description("Test body")
                .type(NotificationType.INTERNAL_NOTIFICATION)
                .read(false).notification_status(true)
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("createNotification()")
    class CreateNotification {

        @Test
        @DisplayName("creates and persists notification for existing user")
        void create_success() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(notificationMapper.toEntity(dto)).thenReturn(notification);
            when(notificationRepository.save(notification)).thenReturn(notification);
            when(notificationMapper.toDTO(notification)).thenReturn(dto);

            NotificationDTO result = notificationService.createNotification(dto, userId);

            assertThat(result.getTitle()).isEqualTo("Test");
            verify(notificationRepository).save(notification);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when user not found")
        void create_userNotFound_throws() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.createNotification(dto, userId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // READ
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("Read operations")
    class ReadOperations {

        @Test
        @DisplayName("getNotificationById returns DTO when found")
        void getById_found() {
            when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));
            when(notificationMapper.toDTO(notification)).thenReturn(dto);

            NotificationDTO result = notificationService.getNotificationById(notifId);

            assertThat(result.getId()).isEqualTo(notifId.toHexString());
        }

        @Test
        @DisplayName("getNotificationById throws when not found")
        void getById_notFound_throws() {
            when(notificationRepository.findById(notifId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.getNotificationById(notifId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("getAllNotifications returns all active notifications")
        void getAll_returnsList() {
            when(notificationRepository.findAll()).thenReturn(List.of(notification));
            when(notificationMapper.toDTO(notification)).thenReturn(dto);

            List<NotificationDTO> results = notificationService.getAllNotifications();

            assertThat(results).hasSize(1);
        }

        @Test
        @DisplayName("getAllNotifications returns empty list when none exist")
        void getAll_empty() {
            when(notificationRepository.findAll()).thenReturn(List.of());

            List<NotificationDTO> results = notificationService.getAllNotifications();

            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("getMyNotifications returns only active notifications for user")
        void getMy_returnsActiveOnly() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(notificationRepository.findByUserAndNotificationStatusTrue(user))
                    .thenReturn(List.of(notification));
            when(notificationMapper.toDTO(notification)).thenReturn(dto);

            List<NotificationDTO> results = notificationService.getMyNotifications(userId);

            assertThat(results).hasSize(1);
            assertThat(results.get(0).getTitle()).isEqualTo("Test");
        }

        @Test
        @DisplayName("getMyUnreadNotifications returns only unread notifications")
        void getMyUnread_returnsUnreadOnly() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(notificationRepository.findByUserAndNotificationStatusTrueAndRead(user, false))
                    .thenReturn(List.of(notification));
            when(notificationMapper.toDTO(notification)).thenReturn(dto);

            List<NotificationDTO> results = notificationService.getMyUnreadNotifications(userId);

            assertThat(results).hasSize(1);
            assertThat(results.get(0).isRead()).isFalse();
        }

        @Test
        @DisplayName("getNotificationsByType filters by type")
        void getByType_filtersCorrectly() {
            when(notificationRepository.findByType(NotificationType.INTERNAL_NOTIFICATION))
                    .thenReturn(List.of(notification));
            when(notificationMapper.toDTO(notification)).thenReturn(dto);

            List<NotificationDTO> results = notificationService
                    .getNotificationsByType(NotificationType.INTERNAL_NOTIFICATION);

            assertThat(results).hasSize(1);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MARK AS READ
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("markAsRead()")
    class MarkAsRead {

        @Test
        @DisplayName("marks notification as read for the owner")
        void markAsRead_success() {
            when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));
            when(notificationRepository.save(notification)).thenReturn(notification);
            when(notificationMapper.toDTO(notification)).thenReturn(
                    NotificationDTO.builder().id(notifId.toHexString()).title("Test")
                            .description("Test body").type(NotificationType.INTERNAL_NOTIFICATION)
                            .read(true).notification_status(true).build());

            NotificationDTO result = notificationService.markAsRead(notifId, userId);

            assertThat(result.isRead()).isTrue();
            verify(notificationRepository).save(argThat(n -> n.isRead()));
        }

        @Test
        @DisplayName("throws AccessDeniedException when user does not own the notification")
        void markAsRead_wrongUser_throws() {
            ObjectId otherId = new ObjectId();
            when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));

            assertThatThrownBy(() -> notificationService.markAsRead(notifId, otherId))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when notification not found")
        void markAsRead_notFound_throws() {
            when(notificationRepository.findById(notifId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> notificationService.markAsRead(notifId, userId))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DEACTIVATE (soft delete)
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("deactivateNotification()")
    class DeactivateNotification {

        @Test
        @DisplayName("soft-deletes notification for the owner")
        void deactivate_success() {
            when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));
            when(notificationRepository.save(any())).thenReturn(notification);
            when(notificationMapper.toDTO(any())).thenReturn(dto);

            notificationService.deactivateNotification(notifId, userId);

            verify(notificationRepository).save(argThat(n -> !n.isNotificationStatus()));
        }

        @Test
        @DisplayName("throws AccessDeniedException when user does not own the notification")
        void deactivate_wrongUser_throws() {
            when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));

            assertThatThrownBy(() -> notificationService.deactivateNotification(notifId, new ObjectId()))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEND NOTIFICATION (preference checks)
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("sendNotification() — preference checks")
    class SendNotification {

        @Test
        @DisplayName("saves notification when all preferences are enabled")
        void send_allEnabled_saves() {
            notificationService.sendNotification(user, "Title", "Body",
                    NotificationType.INTERNAL_NOTIFICATION, "linkedId");

            verify(notificationRepository).save(argThat(n ->
                    n.getTitle().equals("Title") &&
                    n.getType() == NotificationType.INTERNAL_NOTIFICATION &&
                    !n.isRead() &&
                    n.isNotificationStatus()
            ));
        }

        @Test
        @DisplayName("skips when master notificationsEnabled is false")
        void send_masterDisabled_skips() {
            user.setNotificationsEnabled(false);

            notificationService.sendNotification(user, "Title", "Body",
                    NotificationType.INTERNAL_NOTIFICATION, null);

            verify(notificationRepository, never()).save(any());
        }

        @Test
        @DisplayName("skips internal notification when internalNotificationsEnabled is false")
        void send_internalDisabled_skips() {
            user.setInternalNotificationsEnabled(false);

            notificationService.sendNotification(user, "Title", "Body",
                    NotificationType.INTERNAL_NOTIFICATION, null);

            verify(notificationRepository, never()).save(any());
        }

        @Test
        @DisplayName("skips external notification when externalNotificationsEnabled is false")
        void send_externalDisabled_skips() {
            user.setExternalNotificationsEnabled(false);

            notificationService.sendNotification(user, "Title", "Body",
                    NotificationType.EXTERNAL_NOTIFICATION, null);

            verify(notificationRepository, never()).save(any());
        }

        @Test
        @DisplayName("sends external notification when only internal is disabled")
        void send_internalDisabled_externalStillSent() {
            user.setInternalNotificationsEnabled(false);

            notificationService.sendNotification(user, "Promo", "20% off",
                    NotificationType.EXTERNAL_NOTIFICATION, null);

            verify(notificationRepository).save(any());
        }

        @Test
        @DisplayName("sends internal notification when only external is disabled")
        void send_externalDisabled_internalStillSent() {
            user.setExternalNotificationsEnabled(false);

            notificationService.sendNotification(user, "Negotiation", "Accepted",
                    NotificationType.INTERNAL_NOTIFICATION, null);

            verify(notificationRepository).save(any());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BROADCAST
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("broadcast()")
    class Broadcast {

        @Test
        @DisplayName("sends to all users who have external notifications enabled")
        void broadcast_sendsToEligibleUsers() {
            User user2 = User.builder()
                    .id(new ObjectId()).firstName("Bob").lastName("Jones")
                    .email("bob@test.com")
                    .notificationsEnabled(true)
                    .internalNotificationsEnabled(true)
                    .externalNotificationsEnabled(true)
                    .build();

            when(userRepository.findAll()).thenReturn(List.of(user, user2));

            NotificationDTO broadcastDto = NotificationDTO.builder()
                    .title("Black Friday").description("50% off everything").build();

            notificationService.broadcast(broadcastDto);

            // Both users should receive the notification
            verify(notificationRepository, times(2)).save(any());
        }

        @Test
        @DisplayName("skips users who disabled external notifications")
        void broadcast_skipsUsersWithExternalDisabled() {
            User disabledUser = User.builder()
                    .id(new ObjectId()).firstName("Carol").lastName("White")
                    .email("carol@test.com")
                    .notificationsEnabled(true)
                    .internalNotificationsEnabled(true)
                    .externalNotificationsEnabled(false)  // ← disabled
                    .build();

            when(userRepository.findAll()).thenReturn(List.of(user, disabledUser));

            NotificationDTO broadcastDto = NotificationDTO.builder()
                    .title("Promo").description("Deal").build();

            notificationService.broadcast(broadcastDto);

            // Only user (enabled) should receive it
            verify(notificationRepository, times(1)).save(any());
        }

        @Test
        @DisplayName("skips users who disabled all notifications")
        void broadcast_skipsUsersWithAllDisabled() {
            user.setNotificationsEnabled(false);
            when(userRepository.findAll()).thenReturn(List.of(user));

            notificationService.broadcast(NotificationDTO.builder()
                    .title("Alert").description("msg").build());

            verify(notificationRepository, never()).save(any());
        }

        @Test
        @DisplayName("returns the original DTO after broadcast")
        void broadcast_returnsDto() {
            when(userRepository.findAll()).thenReturn(List.of());

            NotificationDTO input = NotificationDTO.builder()
                    .title("Test").description("msg").build();

            NotificationDTO result = notificationService.broadcast(input);

            assertThat(result.getTitle()).isEqualTo("Test");
        }
    }
}
