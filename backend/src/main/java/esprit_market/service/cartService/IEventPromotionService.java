package esprit_market.service.cartService;

import esprit_market.dto.cartDto.AppliedPromotionDTO;
import esprit_market.dto.cartDto.EventPromotionRequest;
import esprit_market.dto.cartDto.EventPromotionResponse;
import org.bson.types.ObjectId;

import java.time.LocalDate;

/**
 * Event Promotion Service Interface
 * 
 * Manages event-based promotions (holidays, birthdays)
 */
public interface IEventPromotionService {
    
    /**
     * Create or update event promotion configuration for a provider
     */
    EventPromotionResponse configureEventPromotion(EventPromotionRequest request, ObjectId providerId, ObjectId shopId);
    
    /**
     * Get event promotion configuration for a provider
     */
    EventPromotionResponse getProviderEventPromotion(ObjectId providerId);
    
    /**
     * Get event promotion configuration for a shop
     */
    EventPromotionResponse getShopEventPromotion(ObjectId shopId);
    
    /**
     * Calculate best event promotion discount for a customer order
     * 
     * @param shopId Shop ID
     * @param customerId Customer ID (for birthday check)
     * @param orderAmount Order total amount
     * @param orderDate Order date (for holiday check)
     * @return Applied promotion DTO with discount details, or null if no promotion applies
     */
    AppliedPromotionDTO calculateBestEventDiscount(ObjectId shopId, ObjectId customerId, Double orderAmount, LocalDate orderDate);
    
    /**
     * Check if today is a Tunisian holiday
     */
    boolean isTodayHoliday();
    
    /**
     * Check if today is customer's birthday
     */
    boolean isTodayCustomerBirthday(ObjectId customerId);
}
