package esprit_market.service.cartService;

import esprit_market.dto.cartDto.ConvertPointsRequest;
import esprit_market.dto.cartDto.LoyaltyCardResponse;
import org.bson.types.ObjectId;

public interface ILoyaltyCardService {
    
    // ==================== READ ====================
    
    LoyaltyCardResponse getOrCreateLoyaltyCard(ObjectId userId);
    
    LoyaltyCardResponse getLoyaltyCardByUserId(ObjectId userId);
    
    // ==================== POINTS MANAGEMENT ====================
    
    LoyaltyCardResponse addPointsForCart(ObjectId userId, Double cartTotal);
    
    LoyaltyCardResponse convertPointsToDiscount(ObjectId userId, ConvertPointsRequest request);
    
    LoyaltyCardResponse addPoints(ObjectId userId, Integer points);
    
    // ==================== UTILITY ====================
    
    String calculateLevel(Integer totalPoints);
    
    double getPointsMultiplier(String level);
    
    int deductPoints(ObjectId userId, Integer pointsToDeduct);
    
    int calculatePointsForAmount(ObjectId userId, Double amount);
}
