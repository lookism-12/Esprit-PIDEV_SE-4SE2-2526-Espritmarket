package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.Enum.cartEnum.RuleTriggerType;
import esprit_market.config.Exceptions;
import esprit_market.dto.cartDto.AutoDiscountRuleRequest;
import esprit_market.dto.cartDto.AutoDiscountRuleResponse;
import esprit_market.entity.cart.AutoDiscountRule;
import esprit_market.repository.cartRepository.AutoDiscountRuleRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Automatic Discount Rule Service Implementation
 * 
 * Business Rules:
 * 1. Providers can only manage their own rules
 * 2. Rule names must be unique per provider
 * 3. Rules are applied automatically during checkout
 * 4. If multiple rules match, apply the one with best discount
 * 5. Rules respect validity dates and active status
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AutoDiscountRuleServiceImpl implements IAutoDiscountRuleService {
    
    private final AutoDiscountRuleRepository autoDiscountRuleRepository;
    private final ShopRepository shopRepository;

    @Override
    @Transactional
    public AutoDiscountRuleResponse createRule(AutoDiscountRuleRequest request, ObjectId providerId, ObjectId shopId) {
        log.info("Creating auto discount rule for provider {} with name: {}", 
                providerId.toHexString(), request.getRuleName());
        
        // Validate shop ownership
        var shop = shopRepository.findById(shopId)
                .filter(s -> s.getOwnerId().equals(providerId))
                .orElseThrow(() -> new Exceptions.AccessDeniedException("Shop does not belong to this provider"));
        
        // Check if rule name already exists for this provider
        if (autoDiscountRuleRepository.existsByProviderIdAndRuleName(providerId, request.getRuleName())) {
            throw new IllegalArgumentException("Rule name already exists: " + request.getRuleName());
        }
        
        // Validate dates
        if (request.getValidFrom() != null && request.getValidUntil() != null &&
            request.getValidUntil().isBefore(request.getValidFrom())) {
            throw new IllegalArgumentException("Valid until date must be after valid from date");
        }
        
        // Validate discount value for percentage type
        if (request.getDiscountType() == DiscountType.PERCENTAGE && request.getDiscountValue() > 100) {
            throw new IllegalArgumentException("Percentage discount cannot exceed 100%");
        }
        
        // Build entity
        AutoDiscountRule rule = AutoDiscountRule.builder()
                .providerId(providerId)
                .shopId(shopId)
                .ruleName(request.getRuleName())
                .triggerType(request.getTriggerType())
                .thresholdValue(request.getThresholdValue())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .maximumDiscount(request.getMaximumDiscount())
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .active(request.getIsActive())
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        AutoDiscountRule saved = autoDiscountRuleRepository.save(rule);
        log.info("Auto discount rule created successfully with ID: {}", saved.getId().toHexString());
        
        return toResponse(saved);
    }

    @Override
    public List<AutoDiscountRuleResponse> getProviderRules(ObjectId providerId) {
        log.info("Fetching all auto discount rules for provider: {}", providerId.toHexString());
        
        List<AutoDiscountRule> rules = autoDiscountRuleRepository.findByProviderId(providerId);
        log.info("Found {} rules for provider {}", rules.size(), providerId.toHexString());
        
        return rules.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public AutoDiscountRuleResponse getRuleById(ObjectId ruleId, ObjectId providerId) {
        log.info("Fetching rule {} for provider {}", ruleId.toHexString(), providerId.toHexString());
        
        AutoDiscountRule rule = autoDiscountRuleRepository.findById(ruleId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Rule not found"));
        
        // Verify ownership
        if (!rule.getProviderId().equals(providerId)) {
            log.error("Provider {} attempted to access rule {} owned by provider {}", 
                    providerId.toHexString(), ruleId.toHexString(), rule.getProviderId().toHexString());
            throw new Exceptions.AccessDeniedException("You do not have permission to access this rule");
        }
        
        return toResponse(rule);
    }

    @Override
    @Transactional
    public AutoDiscountRuleResponse updateRule(ObjectId ruleId, AutoDiscountRuleRequest request, ObjectId providerId) {
        log.info("Updating rule {} for provider {}", ruleId.toHexString(), providerId.toHexString());
        
        AutoDiscountRule existing = autoDiscountRuleRepository.findById(ruleId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Rule not found"));
        
        // Verify ownership
        if (!existing.getProviderId().equals(providerId)) {
            log.error("Provider {} attempted to update rule {} owned by provider {}", 
                    providerId.toHexString(), ruleId.toHexString(), existing.getProviderId().toHexString());
            throw new Exceptions.AccessDeniedException("You do not have permission to update this rule");
        }
        
        // Check if name is being changed and if new name already exists
        if (!existing.getRuleName().equals(request.getRuleName())) {
            if (autoDiscountRuleRepository.existsByProviderIdAndRuleName(providerId, request.getRuleName())) {
                throw new IllegalArgumentException("Rule name already exists: " + request.getRuleName());
            }
        }
        
        // Validate dates
        if (request.getValidFrom() != null && request.getValidUntil() != null &&
            request.getValidUntil().isBefore(request.getValidFrom())) {
            throw new IllegalArgumentException("Valid until date must be after valid from date");
        }
        
        // Validate discount value for percentage type
        if (request.getDiscountType() == DiscountType.PERCENTAGE && request.getDiscountValue() > 100) {
            throw new IllegalArgumentException("Percentage discount cannot exceed 100%");
        }
        
        // Update fields
        existing.setRuleName(request.getRuleName());
        existing.setTriggerType(request.getTriggerType());
        existing.setThresholdValue(request.getThresholdValue());
        existing.setDiscountType(request.getDiscountType());
        existing.setDiscountValue(request.getDiscountValue());
        existing.setMaximumDiscount(request.getMaximumDiscount());
        existing.setPriority(request.getPriority() != null ? request.getPriority() : 0);
        existing.setActive(request.getIsActive());
        existing.setValidFrom(request.getValidFrom());
        existing.setValidUntil(request.getValidUntil());
        existing.setDescription(request.getDescription());
        existing.setUpdatedAt(LocalDateTime.now());
        
        AutoDiscountRule updated = autoDiscountRuleRepository.save(existing);
        log.info("Rule {} updated successfully", ruleId.toHexString());
        
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteRule(ObjectId ruleId, ObjectId providerId) {
        log.info("Deleting rule {} for provider {}", ruleId.toHexString(), providerId.toHexString());
        
        AutoDiscountRule rule = autoDiscountRuleRepository.findById(ruleId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Rule not found"));
        
        // Verify ownership
        if (!rule.getProviderId().equals(providerId)) {
            log.error("Provider {} attempted to delete rule {} owned by provider {}", 
                    providerId.toHexString(), ruleId.toHexString(), rule.getProviderId().toHexString());
            throw new Exceptions.AccessDeniedException("You do not have permission to delete this rule");
        }
        
        autoDiscountRuleRepository.deleteById(ruleId);
        log.info("Rule {} deleted successfully", ruleId.toHexString());
    }

    @Override
    @Transactional
    public AutoDiscountRuleResponse toggleRuleStatus(ObjectId ruleId, Boolean isActive, ObjectId providerId) {
        log.info("Toggling rule {} status to {} for provider {}", 
                ruleId.toHexString(), isActive, providerId.toHexString());
        
        AutoDiscountRule rule = autoDiscountRuleRepository.findById(ruleId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Rule not found"));
        
        // Verify ownership
        if (!rule.getProviderId().equals(providerId)) {
            log.error("Provider {} attempted to toggle rule {} owned by provider {}", 
                    providerId.toHexString(), ruleId.toHexString(), rule.getProviderId().toHexString());
            throw new Exceptions.AccessDeniedException("You do not have permission to modify this rule");
        }
        
        rule.setActive(isActive);
        rule.setUpdatedAt(LocalDateTime.now());
        
        AutoDiscountRule updated = autoDiscountRuleRepository.save(rule);
        log.info("Rule {} status toggled to {}", ruleId.toHexString(), isActive);
        
        return toResponse(updated);
    }

    @Override
    public List<AutoDiscountRuleResponse> getApplicableRulesForShop(ObjectId shopId) {
        log.info("Fetching applicable rules for shop: {}", shopId.toHexString());
        
        List<AutoDiscountRule> rules = autoDiscountRuleRepository.findByShopIdAndActiveTrue(shopId);
        
        // Filter by validity dates
        LocalDate today = LocalDate.now();
        List<AutoDiscountRule> validRules = rules.stream()
                .filter(rule -> {
                    if (rule.getValidFrom() != null && today.isBefore(rule.getValidFrom())) {
                        return false;
                    }
                    if (rule.getValidUntil() != null && today.isAfter(rule.getValidUntil())) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
        
        log.info("Found {} applicable rules for shop {}", validRules.size(), shopId.toHexString());
        
        return validRules.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Double calculateBestDiscount(ObjectId shopId, Double cartTotal, Integer itemQuantity) {
        log.info("Calculating best discount for shop {} with cart total {} and quantity {}", 
                shopId.toHexString(), cartTotal, itemQuantity);
        
        AutoDiscountRuleResponse bestRule = getBestMatchingRule(shopId, cartTotal, itemQuantity);
        
        if (bestRule == null) {
            log.info("No matching rules found");
            return 0.0;
        }
        
        Double discount = calculateDiscount(bestRule, cartTotal);
        log.info("Best discount calculated: {} using rule: {}", discount, bestRule.getRuleName());
        
        return discount;
    }

    @Override
    public AutoDiscountRuleResponse getBestMatchingRule(ObjectId shopId, Double cartTotal, Integer itemQuantity) {
        List<AutoDiscountRuleResponse> applicableRules = getApplicableRulesForShop(shopId);
        
        if (applicableRules.isEmpty()) {
            return null;
        }
        
        // Filter rules that match the cart conditions
        List<AutoDiscountRuleResponse> matchingRules = applicableRules.stream()
                .filter(rule -> ruleMatches(rule, cartTotal, itemQuantity))
                .collect(Collectors.toList());
        
        if (matchingRules.isEmpty()) {
            return null;
        }
        
        // Sort by priority (descending) and then by discount amount (descending)
        return matchingRules.stream()
                .max(Comparator
                        .comparing(AutoDiscountRuleResponse::getPriority)
                        .thenComparing(rule -> calculateDiscount(rule, cartTotal)))
                .orElse(null);
    }
    
    // ==================== HELPER METHODS ====================
    
    private boolean ruleMatches(AutoDiscountRuleResponse rule, Double cartTotal, Integer itemQuantity) {
        return switch (rule.getTriggerType()) {
            case CART_TOTAL_THRESHOLD -> cartTotal >= rule.getThresholdValue();
            case QUANTITY_THRESHOLD -> itemQuantity >= rule.getThresholdValue().intValue();
            case GROUPED_PRODUCT_OFFER -> false; // TODO: Implement grouped product logic
        };
    }
    
    private Double calculateDiscount(AutoDiscountRuleResponse rule, Double cartTotal) {
        if (rule.getDiscountType() == DiscountType.PERCENTAGE) {
            Double discount = cartTotal * (rule.getDiscountValue() / 100.0);
            
            // Apply maximum discount cap if specified
            if (rule.getMaximumDiscount() != null && discount > rule.getMaximumDiscount()) {
                return rule.getMaximumDiscount();
            }
            
            return discount;
        } else {
            // Fixed amount discount
            return Math.min(rule.getDiscountValue(), cartTotal);
        }
    }
    
    private AutoDiscountRuleResponse toResponse(AutoDiscountRule rule) {
        String triggerDesc = formatTriggerDescription(rule);
        String discountDesc = formatDiscountDescription(rule);
        
        return AutoDiscountRuleResponse.builder()
                .id(rule.getId().toHexString())
                .providerId(rule.getProviderId().toHexString())
                .shopId(rule.getShopId().toHexString())
                .ruleName(rule.getRuleName())
                .triggerType(rule.getTriggerType())
                .thresholdValue(rule.getThresholdValue())
                .discountType(rule.getDiscountType())
                .discountValue(rule.getDiscountValue())
                .maximumDiscount(rule.getMaximumDiscount())
                .priority(rule.getPriority())
                .isActive(rule.getActive())
                .validFrom(rule.getValidFrom())
                .validUntil(rule.getValidUntil())
                .description(rule.getDescription())
                .createdAt(rule.getCreatedAt())
                .updatedAt(rule.getUpdatedAt())
                .triggerDescription(triggerDesc)
                .discountDescription(discountDesc)
                .isCurrentlyValid(rule.isValidNow())
                .build();
    }
    
    private String formatTriggerDescription(AutoDiscountRule rule) {
        return switch (rule.getTriggerType()) {
            case CART_TOTAL_THRESHOLD -> 
                String.format("Cart total ≥ %.2f TND", rule.getThresholdValue());
            case QUANTITY_THRESHOLD -> 
                String.format("Quantity ≥ %d items", rule.getThresholdValue().intValue());
            case GROUPED_PRODUCT_OFFER -> 
                "Grouped product offer";
        };
    }
    
    private String formatDiscountDescription(AutoDiscountRule rule) {
        if (rule.getDiscountType() == DiscountType.PERCENTAGE) {
            String desc = String.format("%.0f%% off", rule.getDiscountValue());
            if (rule.getMaximumDiscount() != null) {
                desc += String.format(" (max %.2f TND)", rule.getMaximumDiscount());
            }
            return desc;
        } else {
            return String.format("%.2f TND off", rule.getDiscountValue());
        }
    }
}
