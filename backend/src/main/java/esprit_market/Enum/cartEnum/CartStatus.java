package esprit_market.Enum.cartEnum;

public enum CartStatus {
    DRAFT,
    PENDING,      // Order placed, waiting for payment
    CONFIRMED,    // Payment confirmed, stock reduced
    PAID,         // Alternative confirmed status
    PROCESSING,   // Order is being prepared
    SHIPPED,      // Order shipped
    DELIVERED,    // Order delivered
    CANCELLED,    // Order cancelled, stock restored
    PARTIALLY_CANCELLED,
    PARTIALLY_REFUNDED,
    REFUNDED      // Order refunded, stock restored
}
