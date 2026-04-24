package esprit_market.scheduler;

import esprit_market.Enum.notificationEnum.QueuedNotificationStatus;
import esprit_market.entity.notification.QueuedNotification;
import esprit_market.repository.notificationRepository.QueuedNotificationRepository;
import esprit_market.service.notificationService.NotificationService;
import esprit_market.service.notificationService.NotificationSettingsService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Runs every minute.
 * Finds users with QUEUED notifications whose focus window is no longer active,
 * then flushes their queue in FIFO order.
 */
@Component
@RequiredArgsConstructor
public class FocusModeQueueProcessor {

    private static final Logger log = LoggerFactory.getLogger(FocusModeQueueProcessor.class);

    private final QueuedNotificationRepository queuedNotificationRepository;
    private final NotificationService notificationService;
    private final NotificationSettingsService notificationSettingsService;

    @Scheduled(fixedDelay = 60_000) // every 60 seconds
    public void processQueue() {
        LocalTime now = LocalTime.now();

        List<QueuedNotification> allQueued =
                queuedNotificationRepository.findByStatus(QueuedNotificationStatus.QUEUED);

        if (allQueued.isEmpty()) return;

        // Group by user, then flush only those whose focus window is no longer active
        allQueued.stream()
                .map(QueuedNotification::getUser)
                .collect(Collectors.toSet())          // deduplicate users
                .stream()
                .filter(user -> !notificationSettingsService.isInFocusWindow(user, now))
                .forEach(user -> {
                    log.info("Focus mode ended for user {}, flushing queue", user.getEmail());
                    notificationService.flushQueueForUser(user);
                });
    }
}
