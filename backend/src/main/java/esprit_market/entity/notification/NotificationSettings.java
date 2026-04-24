package esprit_market.entity.notification;

import lombok.*;

/**
 * Embedded document stored inside User.
 * No @Builder.Default — uses explicit no-args constructor for safe MongoDB deserialization.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSettings {

    private boolean externalNotificationsEnabled;
    private boolean internalNotificationsEnabled;
    private boolean focusModeEnabled;

    /** "HH:mm" string, e.g. "21:00" */
    private String focusModeStart;

    /** "HH:mm" string, e.g. "05:00" */
    private String focusModeEnd;

    /** Factory with safe defaults — use instead of new NotificationSettings() */
    public static NotificationSettings defaults() {
        return NotificationSettings.builder()
                .externalNotificationsEnabled(true)
                .internalNotificationsEnabled(true)
                .focusModeEnabled(false)
                .focusModeStart(null)
                .focusModeEnd(null)
                .build();
    }
}
