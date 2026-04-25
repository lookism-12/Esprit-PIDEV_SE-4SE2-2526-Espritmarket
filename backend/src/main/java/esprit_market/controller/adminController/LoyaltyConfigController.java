package esprit_market.controller.adminController;

import esprit_market.dto.cartDto.LoyaltyConfigDTO;
import esprit_market.service.cartService.ILoyaltyConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Controller for managing dynamic loyalty configuration
 */
@RestController
@RequestMapping("/api/admin/loyalty-config")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Loyalty Configuration", description = "Manage loyalty system configuration")
@SecurityRequirement(name = "Bearer Authentication")
public class LoyaltyConfigController {
    
    private final ILoyaltyConfigService loyaltyConfigService;
    
    /**
     * Get the current active loyalty configuration
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get active loyalty configuration", 
               description = "Retrieve the current loyalty system configuration")
    public ResponseEntity<LoyaltyConfigDTO> getActiveConfig() {
        log.info("📥 Admin requesting active loyalty configuration");
        
        LoyaltyConfigDTO config = loyaltyConfigService.getActiveConfigDTO();
        
        return ResponseEntity.ok(config);
    }
    
    /**
     * Update loyalty configuration
     * Validates business rules before saving
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update loyalty configuration", 
               description = "Update loyalty system configuration with validation")
    public ResponseEntity<LoyaltyConfigDTO> updateConfig(
            @Valid @RequestBody LoyaltyConfigDTO dto,
            Authentication authentication) {
        
        String adminUsername = authentication != null ? authentication.getName() : "UNKNOWN";
        
        // Debug logging for 403 troubleshooting
        if (authentication != null) {
            log.info("🔐 Authentication details:");
            log.info("   - Username: {}", authentication.getName());
            log.info("   - Authorities: {}", authentication.getAuthorities());
            log.info("   - Is Authenticated: {}", authentication.isAuthenticated());
        } else {
            log.error("❌ Authentication is NULL - this should not happen!");
        }
        
        log.info("🔧 Admin '{}' updating loyalty configuration", adminUsername);
        log.debug("📦 Received DTO: {}", dto);
        
        try {
            LoyaltyConfigDTO updated = loyaltyConfigService.updateConfig(dto, adminUsername);
            
            log.info("✅ Loyalty configuration updated successfully by '{}'", adminUsername);
            
            return ResponseEntity.ok(updated);
            
        } catch (IllegalArgumentException e) {
            log.error("❌ Validation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            log.error("❌ Unexpected error updating config: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(null);
        }
    }
    
    /**
     * Refresh the cached configuration
     * Useful after manual database updates
     */
    @PostMapping("/refresh-cache")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Refresh configuration cache", 
               description = "Clear and reload loyalty configuration cache")
    public ResponseEntity<String> refreshCache(Authentication authentication) {
        String adminUsername = authentication.getName();
        log.info("🔄 Admin '{}' refreshing loyalty config cache", adminUsername);
        
        loyaltyConfigService.refreshCache();
        
        return ResponseEntity.ok("Loyalty configuration cache refreshed successfully");
    }
    
    /**
     * Create default configuration
     * Only works if no active config exists
     */
    @PostMapping("/initialize")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Initialize default configuration", 
               description = "Create default loyalty configuration if none exists")
    public ResponseEntity<LoyaltyConfigDTO> initializeDefaultConfig(Authentication authentication) {
        String adminUsername = authentication.getName();
        log.info("🏗️ Admin '{}' initializing default loyalty config", adminUsername);
        
        try {
            loyaltyConfigService.createDefaultConfig();
            LoyaltyConfigDTO config = loyaltyConfigService.getActiveConfigDTO();
            
            return ResponseEntity.ok(config);
            
        } catch (Exception e) {
            log.error("❌ Failed to initialize default config: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
