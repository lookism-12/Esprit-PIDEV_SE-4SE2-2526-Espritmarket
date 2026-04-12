package esprit_market.Enum.cartEnum;

/**
 * Order status lifecycle for e-commerce with proper payment flow.
 * 
 * Business Rules:
 * - PENDING: Order created, waiting for provider confirmation
 * - CONFIRMED: Provider confirmed the order, waiting for payment
 * - PAID: Payment completed, loyalty points awarded
 * - DECLINED: Order declined (by client within 7 days OR by provider)
 * 
 * Client permissions:
 * - Can cancel (PENDING/CONFIRMED → DECLINED) ONLY within 7 days
 * 
 * Provider permissions:
 * - Can confirm (PENDING → CONFIRMED)
 * - Can decline (PENDING → DECLINED)
 * 
 * Payment flow:
 * - CONFIRMED → PAID (triggers loyalty points)
 */
public enum OrderStatus {
    PENDING,      // Order created, waiting for provider confirmation
    CONFIRMED,    // Provider confirmed, waiting for payment
    PAID,         // Payment completed, loyalty points awarded
    DECLINED      // Order declined (by client or provider)
}
