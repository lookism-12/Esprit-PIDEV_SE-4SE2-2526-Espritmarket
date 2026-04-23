package esprit_market.Enum.marketplaceEnum;

/**
 * Service availability status for booking system
 */
public enum ServiceStatus {
    /**
     * Service is available for booking (no bookings or has free slots)
     */
    AVAILABLE,
    
    /**
     * Service has some bookings but still has available slots
     */
    PARTIALLY_BOOKED,
    
    /**
     * Service is fully booked (no available slots)
     */
    FULLY_BOOKED,
    
    /**
     * Service is temporarily unavailable
     */
    UNAVAILABLE
}
