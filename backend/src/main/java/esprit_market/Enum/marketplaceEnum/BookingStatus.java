package esprit_market.Enum.marketplaceEnum;

/**
 * Booking status for service reservations
 */
public enum BookingStatus {
    /**
     * Booking request is pending provider approval
     */
    PENDING,
    
    /**
     * Booking is confirmed and active (approved by provider)
     */
    CONFIRMED,
    
    /**
     * Booking was rejected by provider
     */
    REJECTED,
    
    /**
     * Booking was cancelled by user or provider
     */
    CANCELLED,
    
    /**
     * Booking is completed (past date)
     */
    COMPLETED,
    
    /**
     * User didn't show up
     */
    NO_SHOW
}
