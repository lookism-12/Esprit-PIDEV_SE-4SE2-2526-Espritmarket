package esprit_market.controller.providerController;

import esprit_market.config.Exceptions;
import esprit_market.dto.cartDto.AutoDiscountRuleRequest;
import esprit_market.dto.cartDto.AutoDiscountRuleResponse;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.IAutoDiscountRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Auto Discount Rule Controller
 * 
 * Handles provider-specific automatic discount rule management.
 * Base path: /api/provider/discount-rules
 * 
 * Security: ROLE_PROVIDER required for all endpoints
 * 
 * Features:
 * - Create shop-specific automatic discount rules
 * - View own rules only
 * - Update/delete own rules only
 * - Toggle rule active status
 * - Automatic ownership verification
 */
@RestController
@RequestMapping("/api/provider/discount-rules")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROVIDER')")
@Slf4j
public class AutoDiscountRuleController {
    
    private final IAutoDiscountRuleService autoDiscountRuleService;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    
    /**
     * Get all discount rules for the authenticated provider
     */
    @GetMapping
    public ResponseEntity<List<AutoDiscountRuleResponse>> getMyRules(Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Fetching discount rules for provider: {} ({})", 
                    provider.getId().toHexString(), provider.getEmail());
            
            List<AutoDiscountRuleResponse> rules = autoDiscountRuleService.getProviderRules(provider.getId());
            log.info("Returning {} rules for provider {}", rules.size(), provider.getId().toHexString());
            
            return ResponseEntity.ok(rules);
        } catch (Exception e) {
            log.error("Error fetching provider discount rules: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Create a new discount rule for the authenticated provider's shop
     */
    @PostMapping
    public ResponseEntity<?> createRule(
            @Valid @RequestBody AutoDiscountRuleRequest request,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Creating discount rule for provider: {} ({})", 
                    provider.getId().toHexString(), provider.getEmail());
            
            // Get provider's shop
            Shop shop = shopRepository.findByOwnerId(provider.getId())
                    .orElseThrow(() -> new IllegalStateException("No shop found for provider"));
            
            log.info("Provider shop found: {} ({})", shop.getId().toHexString(), shop.getName());
            
            AutoDiscountRuleResponse created = autoDiscountRuleService.createRule(
                    request, provider.getId(), shop.getId());
            
            log.info("Discount rule created successfully: {} for provider {}", 
                    created.getRuleName(), provider.getId().toHexString());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.warn("Validation error creating rule: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IllegalStateException e) {
            log.error("Provider has no shop: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "You must have a shop to create discount rules");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            log.error("Error creating discount rule: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create discount rule: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Get a specific rule by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getRuleById(
            @PathVariable String id,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Fetching rule {} for provider: {}", id, provider.getId().toHexString());
            
            ObjectId ruleId = new ObjectId(id);
            AutoDiscountRuleResponse rule = autoDiscountRuleService.getRuleById(ruleId, provider.getId());
            
            return ResponseEntity.ok(rule);
        } catch (Exceptions.ResourceNotFoundException e) {
            log.warn("Rule not found: {}", id);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Rule not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exceptions.AccessDeniedException e) {
            log.error("Unauthorized access attempt: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "You do not have permission to access this rule");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            log.error("Error fetching rule: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch rule: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Update an existing discount rule (ownership verified)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRule(
            @PathVariable String id,
            @Valid @RequestBody AutoDiscountRuleRequest request,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Updating rule {} for provider: {}", id, provider.getId().toHexString());
            
            ObjectId ruleId = new ObjectId(id);
            AutoDiscountRuleResponse updated = autoDiscountRuleService.updateRule(
                    ruleId, request, provider.getId());
            
            log.info("Rule {} updated successfully", id);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            log.warn("Validation error updating rule: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exceptions.ResourceNotFoundException e) {
            log.warn("Rule not found: {}", id);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Rule not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exceptions.AccessDeniedException e) {
            log.error("Unauthorized access attempt: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "You do not have permission to update this rule");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            log.error("Error updating rule: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update rule: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Toggle rule active status (ownership verified)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> toggleRuleStatus(
            @PathVariable String id,
            @RequestParam Boolean isActive,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Toggling rule {} status to {} for provider: {}", 
                    id, isActive, provider.getId().toHexString());
            
            ObjectId ruleId = new ObjectId(id);
            AutoDiscountRuleResponse updated = autoDiscountRuleService.toggleRuleStatus(
                    ruleId, isActive, provider.getId());
            
            log.info("Rule {} status toggled to {}", id, isActive);
            return ResponseEntity.ok(updated);
        } catch (Exceptions.ResourceNotFoundException e) {
            log.warn("Rule not found: {}", id);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Rule not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exceptions.AccessDeniedException e) {
            log.error("Unauthorized access attempt: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "You do not have permission to modify this rule");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            log.error("Error toggling rule status: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to toggle rule status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Delete a discount rule (ownership verified)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRule(
            @PathVariable String id,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Deleting rule {} for provider: {}", id, provider.getId().toHexString());
            
            ObjectId ruleId = new ObjectId(id);
            autoDiscountRuleService.deleteRule(ruleId, provider.getId());
            
            log.info("Rule {} deleted successfully", id);
            return ResponseEntity.noContent().build();
        } catch (Exceptions.ResourceNotFoundException e) {
            log.warn("Rule not found: {}", id);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Rule not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exceptions.AccessDeniedException e) {
            log.error("Unauthorized access attempt: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "You do not have permission to delete this rule");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            log.error("Error deleting rule: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete rule: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    // ==================== HELPER METHODS ====================
    
    private User getAuthenticatedProvider(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Provider not found"));
    }
}
