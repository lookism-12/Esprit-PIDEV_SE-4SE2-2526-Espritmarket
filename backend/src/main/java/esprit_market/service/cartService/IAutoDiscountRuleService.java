package esprit_market.service.cartService;

import esprit_market.dto.cartDto.AutoDiscountRuleRequest;
import esprit_market.dto.cartDto.AutoDiscountRuleResponse;
import org.bson.types.ObjectId;

import java.util.List;

public interface IAutoDiscountRuleService {
    
    /**
     * Create a new automatic discount rule
     */
    AutoDiscountRuleResponse createRule(AutoDiscountRuleRequest request, ObjectId providerId, ObjectId shopId);
    
    /**
     * Get all rules for a provider
     */
    List<AutoDiscountRuleResponse> getProviderRules(ObjectId providerId);
    
    /**
     * Get a specific rule by ID (with ownership check)
     */
    AutoDiscountRuleResponse getRuleById(ObjectId ruleId, ObjectId providerId);
    
    /**
     * Update a rule (with ownership check)
     */
    AutoDiscountRuleResponse updateRule(ObjectId ruleId, AutoDiscountRuleRequest request, ObjectId providerId);
    
    /**
     * Delete a rule (with ownership check)
     */
    void deleteRule(ObjectId ruleId, ObjectId providerId);
    
    /**
     * Toggle rule active status (with ownership check)
     */
    AutoDiscountRuleResponse toggleRuleStatus(ObjectId ruleId, Boolean isActive, ObjectId providerId);
    
    /**
     * Get applicable rules for a shop (used during checkout)
     */
    List<AutoDiscountRuleResponse> getApplicableRulesForShop(ObjectId shopId);
    
    /**
     * Calculate best discount for cart based on rules
     * Returns the discount amount to apply
     */
    Double calculateBestDiscount(ObjectId shopId, Double cartTotal, Integer itemQuantity);
    
    /**
     * Get the best matching rule for cart
     */
    AutoDiscountRuleResponse getBestMatchingRule(ObjectId shopId, Double cartTotal, Integer itemQuantity);
}
