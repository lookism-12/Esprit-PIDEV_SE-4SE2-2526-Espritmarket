package esprit_market.notification;

import esprit_market.entity.notification.NotificationSettings;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.NotificationSettingsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class NotificationSettingsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationSettingsService service;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder().email("test@example.com").build();
    }

    // ─── External notifications ───────────────────────────────────

    @Test
    @DisplayName("External enabled → can send external")
    void externalEnabled_canSend() {
        user.setNotificationSettings(settings(true, true, false, null, null));
        assertThat(service.canSendNotification(user, "external", LocalTime.of(10, 0))).isTrue();
    }

    @Test
    @DisplayName("External disabled → cannot send external")
    void externalDisabled_cannotSend() {
        user.setNotificationSettings(settings(false, true, false, null, null));
        assertThat(service.canSendNotification(user, "external", LocalTime.of(10, 0))).isFalse();
    }

    // ─── Internal notifications ───────────────────────────────────

    @Test
    @DisplayName("Internal enabled → can send internal")
    void internalEnabled_canSend() {
        user.setNotificationSettings(settings(true, true, false, null, null));
        assertThat(service.canSendNotification(user, "internal", LocalTime.of(10, 0))).isTrue();
    }

    @Test
    @DisplayName("Internal disabled → cannot send internal")
    void internalDisabled_cannotSend() {
        user.setNotificationSettings(settings(true, false, false, null, null));
        assertThat(service.canSendNotification(user, "internal", LocalTime.of(10, 0))).isFalse();
    }

    // ─── Focus mode: same-day range ───────────────────────────────

    @Test
    @DisplayName("Focus mode active, time inside same-day window → muted")
    void focusMode_sameDayWindow_inside_muted() {
        // Focus: 09:00 → 17:00, current time 12:00
        user.setNotificationSettings(settings(true, true, true, LocalTime.of(9, 0), LocalTime.of(17, 0)));
        assertThat(service.canSendNotification(user, "external", LocalTime.of(12, 0))).isFalse();
        assertThat(service.canSendNotification(user, "internal", LocalTime.of(12, 0))).isFalse();
    }

    @Test
    @DisplayName("Focus mode active, time outside same-day window → not muted")
    void focusMode_sameDayWindow_outside_notMuted() {
        // Focus: 09:00 → 17:00, current time 18:00
        user.setNotificationSettings(settings(true, true, true, LocalTime.of(9, 0), LocalTime.of(17, 0)));
        assertThat(service.canSendNotification(user, "external", LocalTime.of(18, 0))).isTrue();
    }

    // ─── Focus mode: overnight range ─────────────────────────────

    @Test
    @DisplayName("Focus mode active, time inside overnight window (after start) → muted")
    void focusMode_overnightWindow_afterStart_muted() {
        // Focus: 21:00 → 05:00, current time 23:00
        user.setNotificationSettings(settings(true, true, true, LocalTime.of(21, 0), LocalTime.of(5, 0)));
        assertThat(service.canSendNotification(user, "internal", LocalTime.of(23, 0))).isFalse();
    }

    @Test
    @DisplayName("Focus mode active, time inside overnight window (before end) → muted")
    void focusMode_overnightWindow_beforeEnd_muted() {
        // Focus: 21:00 → 05:00, current time 03:00
        user.setNotificationSettings(settings(true, true, true, LocalTime.of(21, 0), LocalTime.of(5, 0)));
        assertThat(service.canSendNotification(user, "external", LocalTime.of(3, 0))).isFalse();
    }

    @Test
    @DisplayName("Focus mode active, time outside overnight window → not muted")
    void focusMode_overnightWindow_outside_notMuted() {
        // Focus: 21:00 → 05:00, current time 10:00
        user.setNotificationSettings(settings(true, true, true, LocalTime.of(21, 0), LocalTime.of(5, 0)));
        assertThat(service.canSendNotification(user, "external", LocalTime.of(10, 0))).isTrue();
    }

    @Test
    @DisplayName("Focus mode enabled but no time window defined → not muted")
    void focusMode_enabledNoWindow_notMuted() {
        user.setNotificationSettings(settings(true, true, true, null, null));
        assertThat(service.canSendNotification(user, "internal", LocalTime.of(10, 0))).isTrue();
    }

    // ─── Focus mode disabled ──────────────────────────────────────

    @Test
    @DisplayName("Focus mode disabled, time inside window → not muted (uses type settings)")
    void focusMode_disabled_ignoresWindow() {
        // Focus disabled, window 21:00 → 05:00, time 23:00 — should NOT mute
        user.setNotificationSettings(settings(true, true, false, LocalTime.of(21, 0), LocalTime.of(5, 0)));
        assertThat(service.canSendNotification(user, "external", LocalTime.of(23, 0))).isTrue();
    }

    // ─── Focus mode overrides type settings ───────────────────────

    @Test
    @DisplayName("Focus mode active overrides external=true → still muted")
    void focusMode_overridesExternalEnabled() {
        user.setNotificationSettings(settings(true, true, true, LocalTime.of(21, 0), LocalTime.of(5, 0)));
        assertThat(service.canSendNotification(user, "external", LocalTime.of(22, 0))).isFalse();
    }

    // ─── Null settings fallback ───────────────────────────────────

    @Test
    @DisplayName("Null notificationSettings → defaults allow all")
    void nullSettings_defaultsAllow() {
        user.setNotificationSettings(null);
        assertThat(service.canSendNotification(user, "external", LocalTime.of(10, 0))).isTrue();
        assertThat(service.canSendNotification(user, "internal", LocalTime.of(10, 0))).isTrue();
    }

    // ─── Helper ───────────────────────────────────────────────────

    private NotificationSettings settings(boolean external, boolean internal,
                                          boolean focusEnabled, LocalTime start, LocalTime end) {
        return NotificationSettings.builder()
                .externalNotificationsEnabled(external)
                .internalNotificationsEnabled(internal)
                .focusModeEnabled(focusEnabled)
                .focusModeStart(start)
                .focusModeEnd(end)
                .build();
    }
}
