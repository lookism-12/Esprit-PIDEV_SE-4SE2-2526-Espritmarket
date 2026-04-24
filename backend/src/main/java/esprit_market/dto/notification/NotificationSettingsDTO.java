package esprit_market.dto.notification;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsDTO {

    private boolean externalNotificationsEnabled;
    private boolean internalNotificationsEnabled;
    private boolean focusModeEnabled;

    /** "HH:mm" string, e.g. "21:00" — null means not set */
    private String focusModeStart;

    /** "HH:mm" string, e.g. "05:00" — null means not set */
    private String focusModeEnd;
}
