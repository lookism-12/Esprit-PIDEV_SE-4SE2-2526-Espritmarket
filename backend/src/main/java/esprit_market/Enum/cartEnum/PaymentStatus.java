package esprit_market.Enum.cartEnum;

/**
 * Payment status for orders.
 * 
 * Separate from OrderStatus to handle payment independently.
 * 
 * BUSINESS RULES:
 * - Card payment: PAID immediately when order created
 * - Cash on Delivery: PENDING_PAYMENT until delivery collects payment
 * - Stock is reduced ONLY when paymentStatus = PAID
 * - Loyalty points granted ONLY when paymentStatus = PAID
 * - Delivery can mark PENDING_PAYMENT → PAID when collecting cash
 */
public enum PaymentStatus {
    PENDING_PAYMENT,  // Payment not yet received (Cash on Delivery)
    PAID,             // Payment completed (Card or COD after delivery)
    FAILED,           // Payment failed (deprecated, for backward compatibility)
    
    // ⚠️ DEPRECATED - Backward compatibility only (do NOT use in new code)
    @Deprecated PENDING  // Legacy: Mapped to PENDING_PAYMENT
}
