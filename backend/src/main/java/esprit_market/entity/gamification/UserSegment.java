package esprit_market.entity.gamification;

/**
 * User segments for targeted rewards
 */
public enum UserSegment {
    NEW,        // New users (first time spinning)
    RETURNING,  // Users who have spun before
    VIP,        // High-value customers
    ALL         // All users
}
