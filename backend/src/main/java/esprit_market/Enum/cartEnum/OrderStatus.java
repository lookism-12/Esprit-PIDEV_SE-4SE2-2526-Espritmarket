package esprit_market.Enum.cartEnum;

/**
 * Order status lifecycle for marketplace with provider confirmation and delivery.
 * 
 * IMPORTANT: This is SEPARATE from PaymentStatus.
 * - OrderStatus tracks order fulfillment workflow
 * - PaymentStatus tracks payment collection
 * 
 * BUSINESS FLOW:
 * 
 * CASE 1: CARD PAYMENT
 * 1. Order created → orderStatus = PENDING, paymentStatus = PAID
 * 2. Provider confirms → orderStatus = CONFIRMED, stock reduced immediately
 * 3. Loyalty points granted when CONFIRMED (payment already received)
 * 4. Delivery: CONFIRMED → PREPARING → IN_TRANSIT → DELIVERED
 * 5. If delivery fails: IN_TRANSIT → RETURNED (stock restored automatically)
 * 
 * CASE 2: CASH ON DELIVERY
 * 1. Order created → orderStatus = PENDING, paymentStatus = PENDING_PAYMENT
 * 2. Provider confirms → orderStatus = CONFIRMED, stock reduced immediately
 * 3. Delivery: CONFIRMED → PREPARING → IN_TRANSIT
 * 4. On successful delivery: IN_TRANSIT → DELIVERED, paymentStatus = PAID, loyalty points granted
 * 5. If delivery fails: IN_TRANSIT → RETURNED (stock restored automatically)
 * 
 * PROVIDER WORKFLOW:
 * - Provider can only: PENDING → CONFIRMED or PENDING → CANCELLED
 * - Provider CANNOT change to PAID (that's PaymentStatus, not OrderStatus)
 * - When provider confirms: stock is reduced immediately
 * 
 * DELIVERY WORKFLOW:
 * - CONFIRMED → PREPARING (delivery accepts order)
 * - PREPARING → IN_TRANSIT (package out for delivery)
 * - IN_TRANSIT → DELIVERED (successful delivery)
 * - IN_TRANSIT → RETURNED (failed delivery, package returned to shop)
 * 
 * STOCK LOGIC:
 * - Stock reduced when: orderStatus = CONFIRMED
 * - Stock restored when: orderStatus = RESTOCKED (provider verified return) or CANCELLED (if was CONFIRMED)
 * 
 * RETURNED vs RESTOCKED:
 * - RETURNED: Package returned by delivery, waiting for provider verification
 * - RESTOCKED: Provider verified returned item and stock has been restored
 * 
 * CANCELLATION:
 * - PENDING → CANCELLED: no stock to restore
 * - CONFIRMED → CANCELLED: restore stock
 * - Cannot cancel after PREPARING (too late, already in delivery process)
 * 
 * RETURNED vs CANCELLED:
 * - CANCELLED: Order cancelled before shipping (by provider/client)
 * - RETURNED: Package returned after failed delivery attempt (by delivery)
 * 
 * TRANSITION RULES:
 * - PENDING → CONFIRMED (provider accepts)
 * - PENDING → CANCELLED (provider rejects OR client cancels)
 * - CONFIRMED → PREPARING (delivery accepts)
 * - CONFIRMED → CANCELLED (client/admin cancels before delivery starts)
 * - PREPARING → IN_TRANSIT (delivery starts)
 * - IN_TRANSIT → DELIVERED (delivery success)
 * - IN_TRANSIT → RETURNED (delivery failed)
 * 
 * FINAL STATES:
 * - DELIVERED (success)
 * - RESTOCKED (returned and verified)
 * - CANCELLED (cancelled before shipping)
 * 
 * BACKWARD COMPATIBILITY:
 * - PAID, ACCEPTED, PROCESSING, DECLINED, SHIPPED are deprecated legacy statuses
 * - They are kept for backward compatibility with old MongoDB data
 * - New code should NOT use these statuses
 * - They will be migrated to new statuses on read
 */
public enum OrderStatus {
    PENDING,           // Order created, waiting for provider confirmation
    CONFIRMED,         // Provider accepted, ready for delivery
    PREPARING,         // Delivery accepted, preparing package
    IN_TRANSIT,        // Package out for delivery
    DELIVERED,         // Successfully delivered to client
    RETURNED,          // Package returned to shop after failed delivery (NOT yet verified/restocked)
    RESTOCKED,         // Provider verified returned item and stock has been restored
    CANCELLED,         // Cancelled by provider/client before shipping
    
    // ⚠️ DEPRECATED - Backward compatibility only (do NOT use in new code)
    @Deprecated PAID,           // Legacy: This is PaymentStatus, not OrderStatus - mapped to CONFIRMED
    @Deprecated ACCEPTED,       // Legacy: Mapped to CONFIRMED
    @Deprecated PROCESSING,     // Legacy: Mapped to PREPARING
    @Deprecated DECLINED,       // Legacy: Mapped to CANCELLED
    @Deprecated SHIPPED,        // Legacy: Mapped to IN_TRANSIT
    @Deprecated OUT_FOR_DELIVERY // Legacy: Mapped to IN_TRANSIT
}

