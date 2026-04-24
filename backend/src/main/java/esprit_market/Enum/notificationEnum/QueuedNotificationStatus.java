package esprit_market.Enum.notificationEnum;

public enum QueuedNotificationStatus {
    /** Held during focus mode, not yet delivered */
    QUEUED,
    /** Successfully flushed and saved as a real Notification */
    DELIVERED
}
