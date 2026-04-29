package esprit_market.controller.providerController;

import esprit_market.dto.cartDto.EventPromotionRequest;
import esprit_market.dto.cartDto.EventPromotionResponse;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.IEventPromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Event Promotion Controller
 * 
 * Allows providers to configure event-based promotions (holidays, birthdays)
 */
@RestController
@RequestMapping("/api/provider/event-promotions")
@RequiredArgsConstructor
@Tag(name = "Provider Event Promotions", description = "Event-based promotion management for providers")
@SecurityRequirement(name = "Bearer Authentication")
@PreAuthorize("hasRole('PROVIDER')")
@Slf4j
public class EventPromotionController {
    
    private final IEventPromotionService eventPromotionService;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;

    @PostMapping("/configure")
    @Operation(summary = "Configure event promotions", 
               description = "Create or update event promotion configuration (holidays, birthdays)")
    public ResponseEntity<EventPromotionResponse> configureEventPromotion(
            @Valid @RequestBody EventPromotionRequest request,
            Authentication authentication) {
        
        User provider = getAuthenticatedProvider(authentication);
        ObjectId providerId = provider.getId();
        
        // Get provider's shop
        Shop shop = shopRepository.findByOwnerId(providerId)
                .orElseThrow(() -> new IllegalStateException("No shop found for provider"));
        
        ObjectId shopId = shop.getId();
        
        log.info("Provider {} configuring event promotions for shop {}", 
                providerId.toHexString(), shopId.toHexString());
        
        EventPromotionResponse response = eventPromotionService.configureEventPromotion(
                request, providerId, shopId);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get event promotion configuration", 
               description = "Get current event promotion configuration for the provider")
    public ResponseEntity<EventPromotionResponse> getEventPromotion(
            Authentication authentication) {
        
        User provider = getAuthenticatedProvider(authentication);
        ObjectId providerId = provider.getId();
        
        log.info("Provider {} fetching event promotion configuration", providerId.toHexString());
        
        EventPromotionResponse response = eventPromotionService.getProviderEventPromotion(providerId);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/holiday-check")
    @Operation(summary = "Check if today is a holiday", 
               description = "Check if today is a Tunisian holiday")
    public ResponseEntity<Boolean> isTodayHoliday() {
        boolean isHoliday = eventPromotionService.isTodayHoliday();
        return ResponseEntity.ok(isHoliday);
    }
    
    // ==================== HELPER METHODS ====================
    
    private User getAuthenticatedProvider(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Provider not found"));
    }
}
