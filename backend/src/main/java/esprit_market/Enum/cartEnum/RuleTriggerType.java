package esprit_market.Enum.cartEnum;

/**
 * Rule Trigger Types for Automatic Discount Rules
 * 
 * Defines the conditions that trigger automatic discount application
 */
public enum RuleTriggerType {
    /**
     * Triggered when cart total exceeds a threshold
     * Example: Cart total > 200 TND → apply discount
     */
    CART_TOTAL_THRESHOLD,
    
    /**
     * Triggered when quantity of items reaches a threshold
     * Example: Buy 3 or more items → apply discount
     */
    QUANTITY_THRESHOLD,
    
    /**
     * Triggered when specific grouped products are in cart
     * Example: Buy product A + product B → apply discount
     */
    GROUPED_PRODUCT_OFFER
}
