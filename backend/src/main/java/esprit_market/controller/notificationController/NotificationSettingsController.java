package esprit_market.controller.notificationController;

import esprit_market.dto.notification.NotificationSettingsDTO;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.NotificationSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications/settings")
@RequiredArgsConstructor
@Tag(name = "Notification Settings", description = "Manage per-user notification preferences and focus mode")
public class NotificationSettingsController {

    private static final Logger log = LoggerFactory.getLogger(NotificationSettingsController.class);

    private final NotificationSettingsService notificationSettingsService;
    private final UserRepository userRepository;

    private ObjectId resolveUserId(Authentication authentication) {
        if (authentication == null)
            throw new RuntimeException("Authentication required");
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return user.getId();
    }

    @GetMapping("/debug")
    @Operation(summary = "Debug — returns raw user fields without touching NotificationSettings")
    public ResponseEntity<Map<String, Object>> debug(Authentication authentication) {
        try {
            String email = authentication.getName();
            log.info("DEBUG: looking up user {}", email);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            log.info("DEBUG: user found id={}, notificationSettings={}", user.getId(), user.getNotificationSettings());
            return ResponseEntity.ok(Map.of(
                "id", user.getId().toHexString(),
                "email", user.getEmail(),
                "notificationSettings", user.getNotificationSettings() == null ? "NULL" : user.getNotificationSettings().toString(),
                "internalEnabled", user.isInternalNotificationsEnabled(),
                "externalEnabled", user.isExternalNotificationsEnabled()
            ));
        } catch (Exception e) {
            log.error("DEBUG endpoint error", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", e.getClass().getName(),
                "message", String.valueOf(e.getMessage()),
                "cause", e.getCause() != null ? e.getCause().getMessage() : "none"
            ));
        }
    }

    @GetMapping
    @Operation(summary = "Get my notification settings")
    public ResponseEntity<NotificationSettingsDTO> getMySettings(Authentication authentication) {
        try {
            ObjectId userId = resolveUserId(authentication);
            log.info("GET settings for userId={}", userId);
            NotificationSettingsDTO result = notificationSettingsService.getSettings(userId);
            log.info("GET settings result={}", result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("GET /api/notifications/settings failed", e);
            throw e;
        }
    }

    @PutMapping
    @Operation(summary = "Update my notification settings")
    public ResponseEntity<NotificationSettingsDTO> updateMySettings(
            @RequestBody NotificationSettingsDTO dto,
            Authentication authentication) {
        return ResponseEntity.ok(notificationSettingsService.updateSettings(resolveUserId(authentication), dto));
    }
}
