package esprit_market.service.cartService;

import esprit_market.dto.cartDto.AppliedPromotionDTO;
import esprit_market.dto.cartDto.AutoDiscountRuleResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Promotion Engine Service
 * 
 * Central service that evaluates ALL promotion types and applies the BEST discount.
 * 
 * Promotion Types:
 * 1. Auto Discount Rules (order-based: cart total, quantity)
 * 2. Event Promotions (holiday, birthday)
 * 3. Provider Coupons (manual codes - handled separately)
 * 
 * Business Rule: ONLY the BEST discount is applied (highest value)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionEngineService {
    
    private final IAutoDiscountRuleService autoDiscountRuleService;
    private final IEventPromotionService eventPromotionService;

    /**
     * Evaluate all promotions and return the BEST discount
     * 
     * @param shopId Shop ID
     * @param customerId Customer ID (null for guests)
     * @param orderAmount Order total amount
     * @param itemQuantity Total item quantity
     * @param orderDate Order date
     * @return Applied promotion with best discount, or null if no promotion applies
     */
    public AppliedPromotionDTO evaluateBestPromotion(
            ObjectId shopId, 
            ObjectId customerId, 
            Double orderAmount, 
            Integer itemQuantity,
            LocalDate orderDate) {
        
        log.info("🎯 Evaluating promotions for shop {} | Amount: {} | Quantity: {} | Date: {}", 
                shopId.toHexString(), orderAmount, itemQuantity, orderDate);
        
        List<AppliedPromotionDTO> candidates = new ArrayList<>();
        
        // 1. Evaluate Auto Discount Rules (order-based)
        AutoDiscountRuleResponse bestRule = autoDiscountRuleService.getBestMatchingRule(
                shopId, orderAmount, itemQuantity);
        
        if (bestRule != null) {
            Double ruleDiscount = autoDiscountRuleService.calculateBestDiscount(
                    shopId, orderAmount, itemQuantity);
            
            if (ruleDiscount > 0) {
                AppliedPromotionDTO rulePromotion = AppliedPromotionDTO.builder()
                        .promotionType("ORDER_BASED")
                        .discountAmount(ruleDiscount)
                        .discountPercentage(bestRule.getDiscountValue())
                        .description(String.format("🎯 %s: %s", 
                                bestRule.getRuleName(), bestRule.getDiscountDescription()))
                        .promotionId(bestRule.getId())
                        .promotionName(bestRule.getRuleName())
                        .build();
                
                candidates.add(rulePromotion);
                log.info("✅ Order-based promotion: {} TND ({})", ruleDiscount, bestRule.getRuleName());
            }
        }
        
        // 2. Evaluate Event Promotions (holiday, birthday)
        AppliedPromotionDTO eventPromotion = eventPromotionService.calculateBestEventDiscount(
                shopId, customerId, orderAmount, orderDate);
        
        if (eventPromotion != null && eventPromotion.getDiscountAmount() > 0) {
            candidates.add(eventPromotion);
            log.info("✅ Event promotion: {} TND ({})", 
                    eventPromotion.getDiscountAmount(), eventPromotion.getPromotionType());
        }
        
        // 3. Select BEST discount (highest value)
        if (candidates.isEmpty()) {
            log.info("❌ No promotions applicable");
            return null;
        }
        
        AppliedPromotionDTO bestPromotion = candidates.stream()
                .max(Comparator.comparing(AppliedPromotionDTO::getDiscountAmount))
                .orElse(null);
        
        if (bestPromotion != null) {
            log.info("🏆 BEST PROMOTION: {} | Discount: {} TND | Type: {}", 
                    bestPromotion.getDescription(), 
                    bestPromotion.getDiscountAmount(),
                    bestPromotion.getPromotionType());
        }
        
        return bestPromotion;
    }
    
    /**
     * Calculate final price after applying best promotion
     */
    public Double calculateFinalPrice(Double originalAmount, AppliedPromotionDTO promotion) {
        if (promotion == null || promotion.getDiscountAmount() == null) {
            return originalAmount;
        }
        
        Double finalPrice = originalAmount - promotion.getDiscountAmount();
        return Math.max(finalPrice, 0.0); // Never go below 0
    }
}
