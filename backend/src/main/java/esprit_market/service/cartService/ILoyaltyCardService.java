package esprit_market.service.cartService;

import esprit_market.dto.cartDto.ConvertPointsRequest;
import esprit_market.dto.cartDto.LoyaltyCardResponse;
import esprit_market.entity.cart.OrderItem;
import org.bson.types.ObjectId;

import java.util.List;

public interface ILoyaltyCardService {
    
    // ==================== READ ====================
    
    LoyaltyCardResponse getOrCreateLoyaltyCard(ObjectId userId);
    
    LoyaltyCardResponse getLoyaltyCardByUserId(ObjectId userId);
    
    // ==================== POINTS MANAGEMENT ====================
    
    /**
     * Calculate and add loyalty points for a completed order.
     * 
     * Formula:
     * 1. Base points = sum(productPrice * quantity * 0.1) for all items
     * 2. Apply tier multiplier (BRONZE=1.0, SILVER=1.2, GOLD=1.5, PLATINUM=2.0)
     * 3. Add bonuses:
     *    - If total quantity >= 5 → +10% bonus points
     *    - If total price > 200 → +20 flat points
     * 
     * @param userId User ID
     * @param orderItems List of order items
     * @param totalAmount Total order amount
     * @return Updated loyalty card
     */
    LoyaltyCardResponse addPointsForOrder(ObjectId userId, List<OrderItem> orderItems, Double totalAmount);
    
    /**
     * @deprecated Use addPointsForOrder instead for accurate calculation
     */
    @Deprecated
    LoyaltyCardResponse addPointsForCart(ObjectId userId, Double cartTotal);
    
    LoyaltyCardResponse convertPointsToDiscount(ObjectId userId, ConvertPointsRequest request);
    
    LoyaltyCardResponse addPoints(ObjectId userId, Integer points);
    
    // ==================== UTILITY ====================
    
    String calculateLevel(Integer totalPoints);
    
    double getPointsMultiplier(String level);
    
    int deductPoints(ObjectId userId, Integer pointsToDeduct);
    
    int calculatePointsForAmount(ObjectId userId, Double amount);
    
    /**
     * Calculate points for a specific order without saving.
     * Used for deduction calculations.
     */
    int calculatePointsForOrder(ObjectId userId, List<OrderItem> orderItems, Double totalAmount);
}
