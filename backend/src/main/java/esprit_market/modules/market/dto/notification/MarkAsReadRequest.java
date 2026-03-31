package esprit_market.modules.market.dto.notification;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MarkAsReadRequest(@NotNull UUID notificationId) {
}
