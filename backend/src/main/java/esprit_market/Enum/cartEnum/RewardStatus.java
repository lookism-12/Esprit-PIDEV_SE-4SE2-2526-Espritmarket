package esprit_market.Enum.cartEnum;

/**
 * Status of a user's reward
 */
public enum RewardStatus {
    /**
     * Reward is active and can be used
     */
    ACTIVE,
    
    /**
     * Reward has been used in an order
     */
    USED,
    
    /**
     * Reward has expired (validity period passed)
     */
    EXPIRED,
    
    /**
     * Reward was cancelled (points refunded)
     */
    CANCELLED
}
