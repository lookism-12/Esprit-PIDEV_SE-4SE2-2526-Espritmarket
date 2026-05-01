package esprit_market.Enum.notificationEnum;

public enum NotificationType {
    INTERNAL_NOTIFICATION,   // liée aux activités de l'utilisateur (messages, négociations, etc.)
    EXTERNAL_NOTIFICATION,   // liée aux événements externes (promotions, Black Friday, etc.)
    RIDE_UPDATE,             // Carpooling module: ride updates, cancellations, etc.
    NEGOTIATION_ACCEPTED,    // Triggered when a provider accepts a client's offer
    NEGOTIATION_PROPOSAL,    // New offer or counter-offer received
    COUPON_ALERT,           // Provider created a new coupon available for customers
    CART_EXPIRATION_WARNING, // Cart will expire in 24 hours
    CART_EXPIRATION_URGENT   // Cart will expire very soon (< 30 minutes)
}
