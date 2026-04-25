package esprit_market.repository.cartRepository;

import esprit_market.Enum.cartEnum.RuleTriggerType;
import esprit_market.entity.cart.AutoDiscountRule;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AutoDiscountRuleRepository extends MongoRepository<AutoDiscountRule, ObjectId> {
    
    /**
     * Find all rules for a specific provider
     */
    List<AutoDiscountRule> findByProviderId(ObjectId providerId);
    
    /**
     * Find all active rules for a specific provider
     */
    List<AutoDiscountRule> findByProviderIdAndActiveTrue(ObjectId providerId);
    
    /**
     * Find all rules for a specific shop
     */
    List<AutoDiscountRule> findByShopId(ObjectId shopId);
    
    /**
     * Find all active rules for a specific shop
     */
    List<AutoDiscountRule> findByShopIdAndActiveTrue(ObjectId shopId);
    
    /**
     * Find rules by trigger type for a shop
     */
    List<AutoDiscountRule> findByShopIdAndTriggerType(ObjectId shopId, RuleTriggerType triggerType);
    
    /**
     * Find active rules by trigger type for a shop
     */
    List<AutoDiscountRule> findByShopIdAndActiveTrueAndTriggerType(ObjectId shopId, RuleTriggerType triggerType);
    
    /**
     * Check if a rule name exists for a provider
     */
    boolean existsByProviderIdAndRuleName(ObjectId providerId, String ruleName);
    
    /**
     * Find rule by name and provider
     */
    Optional<AutoDiscountRule> findByProviderIdAndRuleName(ObjectId providerId, String ruleName);
}
