package esprit_market.service.notificationService;

import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.notification.NotificationSettingsDTO;
import esprit_market.entity.notification.NotificationSettings;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Service
@RequiredArgsConstructor
public class NotificationSettingsService {

    private static final Logger log = LoggerFactory.getLogger(NotificationSettingsService.class);
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────
    // Core logic
    // ─────────────────────────────────────────────────────────────

    public boolean canSendNotification(User user, String notificationType, LocalTime currentTime) {
        NotificationSettings s = resolveSettings(user);

        if (s.isFocusModeEnabled() && isInFocusWindow(s, currentTime)) {
            log.debug("Focus mode active for user {}: muting {} at {}", user.getEmail(), notificationType, currentTime);
            return false;
        }

        return switch (notificationType.toLowerCase()) {
            case "external" -> s.isExternalNotificationsEnabled();
            case "internal" -> s.isInternalNotificationsEnabled();
            default -> {
                log.warn("Unknown notification type '{}', defaulting to allow", notificationType);
                yield true;
            }
        };
    }

    public boolean isInFocusWindow(User user, LocalTime time) {
        NotificationSettings s = resolveSettings(user);
        return s.isFocusModeEnabled() && isInFocusWindow(s, time);
    }

    public boolean isInFocusWindow(NotificationSettings s, LocalTime time) {
        LocalTime start = parseTime(s.getFocusModeStart());
        LocalTime end   = parseTime(s.getFocusModeEnd());
        if (start == null || end == null) return false;

        if (start.isBefore(end)) {
            return !time.isBefore(start) && time.isBefore(end);
        } else {
            // overnight: e.g. 21:00 → 05:00
            return !time.isBefore(start) || time.isBefore(end);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────

    public NotificationSettingsDTO getSettings(ObjectId userId) {
        return toDTO(resolveSettings(getUser(userId)));
    }

    @Transactional
    public NotificationSettingsDTO updateSettings(ObjectId userId, NotificationSettingsDTO dto) {
        User user = getUser(userId);

        NotificationSettings updated = NotificationSettings.builder()
                .externalNotificationsEnabled(dto.isExternalNotificationsEnabled())
                .internalNotificationsEnabled(dto.isInternalNotificationsEnabled())
                .focusModeEnabled(dto.isFocusModeEnabled())
                .focusModeStart(sanitize(dto.getFocusModeStart()))
                .focusModeEnd(sanitize(dto.getFocusModeEnd()))
                .build();
        user.setNotificationSettings(updated);
        user.setInternalNotificationsEnabled(dto.isInternalNotificationsEnabled());
        user.setExternalNotificationsEnabled(dto.isExternalNotificationsEnabled());

        userRepository.save(user);
        log.info("Notification settings updated for user {}", user.getEmail());
        return toDTO(updated);
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private User getUser(ObjectId id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id.toHexString()));
    }

    private NotificationSettings resolveSettings(User user) {
        if (user.getNotificationSettings() == null) {
            return NotificationSettings.defaults();
        }
        return user.getNotificationSettings();
    }

    private NotificationSettingsDTO toDTO(NotificationSettings s) {
        return NotificationSettingsDTO.builder()
                .externalNotificationsEnabled(s.isExternalNotificationsEnabled())
                .internalNotificationsEnabled(s.isInternalNotificationsEnabled())
                .focusModeEnabled(s.isFocusModeEnabled())
                .focusModeStart(s.getFocusModeStart())
                .focusModeEnd(s.getFocusModeEnd())
                .build();
    }

    /** Parse "HH:mm" or "HH:mm:ss" → LocalTime, null-safe */
    private LocalTime parseTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            String hhmm = value.length() > 5 ? value.substring(0, 5) : value;
            return LocalTime.parse(hhmm, HH_MM);
        } catch (DateTimeParseException e) {
            log.warn("Invalid time value '{}', ignoring", value);
            return null;
        }
    }

    /** Trim to "HH:mm", reject garbage, return null if blank */
    private String sanitize(String value) {
        if (value == null || value.isBlank()) return null;
        String hhmm = value.length() > 5 ? value.substring(0, 5) : value;
        // Validate it actually parses
        try { LocalTime.parse(hhmm, HH_MM); } catch (DateTimeParseException e) { return null; }
        return hhmm;
    }
}
