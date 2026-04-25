package esprit_market.controller.providerController;

import esprit_market.config.Exceptions;
import esprit_market.dto.cartDto.ProviderCouponRequest;
import esprit_market.dto.cartDto.ProviderCouponResponse;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.CouponNotValidException;
import esprit_market.service.cartService.IProviderCouponService;
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
 * Provider Coupon Controller
 * 
 * Handles provider-specific coupon management.
 * Base path: /api/provider/coupons
 * 
 * Security: ROLE_PROVIDER required for all endpoints
 * 
 * Features:
 * - Create shop-specific coupons
 * - View own coupons only
 * - Update/delete own coupons only
 * - Toggle coupon active status
 * - Automatic ownership verification
 */
@RestController
@RequestMapping("/api/provider/coupons")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROVIDER')")
@Slf4j
public class ProviderCouponController {
    
    private final IProviderCouponService providerCouponService;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    
    /**
     * Get all coupons for the authenticated provider
     */
    @GetMapping
    public ResponseEntity<List<ProviderCouponResponse>> getMyCoupons(Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Fetching coupons for provider: {} ({})", 
                    provider.getId().toHexString(), provider.getEmail());
            
            List<ProviderCouponResponse> coupons = providerCouponService.getProviderCoupons(provider.getId());
            log.info("Returning {} coupons for provider {}", coupons.size(), provider.getId().toHexString());
            
            return ResponseEntity.ok(coupons);
        } catch (Exception e) {
            log.error("Error fetching provider coupons: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Create a new coupon for the authenticated provider's shop
     */
    @PostMapping
    public ResponseEntity<?> createCoupon(
            @Valid @RequestBody ProviderCouponRequest request,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Creating coupon for provider: {} ({})", 
                    provider.getId().toHexString(), provider.getEmail());
            
            // Get provider's shop
            Shop shop = shopRepository.findByOwnerId(provider.getId())
                    .orElseThrow(() -> new IllegalStateException("No shop found for provider"));
            
            log.info("Provider shop found: {} ({})", shop.getId().toHexString(), shop.getName());
            
            ProviderCouponResponse created = providerCouponService.createCoupon(
                    request, provider.getId(), shop.getId());
            
            log.info("Coupon created successfully: {} for provider {}", 
                    created.getCode(), provider.getId().toHexString());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            log.warn("Validation error creating coupon: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (IllegalStateException e) {
            log.error("Provider has no shop: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "You must have a shop to create coupons");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            log.error("Error creating coupon: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create coupon: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Update an existing coupon (ownership verified)
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCoupon(
            @PathVariable String id,
            @Valid @RequestBody ProviderCouponRequest request,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Updating coupon {} for provider: {}", id, provider.getId().toHexString());
            
            ObjectId couponId = new ObjectId(id);
            ProviderCouponResponse updated = providerCouponService.updateCoupon(
                    couponId, request, provider.getId());
            
            log.info("Coupon {} updated successfully", id);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            log.warn("Validation error updating coupon: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exceptions.ResourceNotFoundException e) {
            log.warn("Coupon not found: {}", id);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Coupon not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exceptions.AccessDeniedException e) {
            log.error("Unauthorized access attempt: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "You do not have permission to update this coupon");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            log.error("Error updating coupon: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to update coupon: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Toggle coupon active status (ownership verified)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> toggleCouponStatus(
            @PathVariable String id,
            @RequestParam Boolean isActive,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Toggling coupon {} status to {} for provider: {}", 
                    id, isActive, provider.getId().toHexString());
            
            ObjectId couponId = new ObjectId(id);
            ProviderCouponResponse updated = providerCouponService.toggleCouponStatus(
                    couponId, isActive, provider.getId());
            
            log.info("Coupon {} status toggled to {}", id, isActive);
            return ResponseEntity.ok(updated);
        } catch (Exceptions.ResourceNotFoundException e) {
            log.warn("Coupon not found: {}", id);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Coupon not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exceptions.AccessDeniedException e) {
            log.error("Unauthorized access attempt: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "You do not have permission to modify this coupon");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            log.error("Error toggling coupon status: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to toggle coupon status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Delete a coupon (ownership verified)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCoupon(
            @PathVariable String id,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            log.info("Deleting coupon {} for provider: {}", id, provider.getId().toHexString());
            
            ObjectId couponId = new ObjectId(id);
            providerCouponService.deleteCoupon(couponId, provider.getId());
            
            log.info("Coupon {} deleted successfully", id);
            return ResponseEntity.noContent().build();
        } catch (Exceptions.ResourceNotFoundException e) {
            log.warn("Coupon not found: {}", id);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Coupon not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exceptions.AccessDeniedException e) {
            log.error("Unauthorized access attempt: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "You do not have permission to delete this coupon");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        } catch (Exception e) {
            log.error("Error deleting coupon: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete coupon: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Validate a coupon code for the provider's shop
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateCoupon(
            @RequestParam String code,
            @RequestParam Double orderTotal,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            
            // Get provider's shop
            Shop shop = shopRepository.findByOwnerId(provider.getId())
                    .orElseThrow(() -> new IllegalStateException("No shop found for provider"));
            
            log.info("Validating coupon {} for shop {} with order total {}", 
                    code, shop.getId().toHexString(), orderTotal);
            
            ProviderCouponResponse validated = providerCouponService.validateCoupon(
                    code, shop.getId(), orderTotal);
            
            log.info("Coupon {} validated successfully", code);
            return ResponseEntity.ok(validated);
        } catch (CouponNotValidException e) {
            log.warn("Coupon validation failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Error validating coupon: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to validate coupon: " + e.getMessage());
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
