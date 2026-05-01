package esprit_market.controller.cartController;

import esprit_market.dto.cartDto.*;
import esprit_market.service.cartService.AdvancedLoyaltyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Advanced Loyalty System REST API
 * 
 * Endpoints:
 * - GET /dashboard - Complete loyalty dashboard
 * - GET /rewards - Available rewards
 * - GET /rewards/affordable - Rewards user can afford
 * - POST /rewards/convert - Convert points to reward
 * - GET /my-rewards - User's active rewards
 * - GET /top-shops - User's top 3 shops
 */
@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Advanced Loyalty", description = "Dynamic loyalty system with rewards and shop restrictions")
public class AdvancedLoyaltyController {
    
    private final AdvancedLoyaltyService loyaltyService;
    private final esprit_market.repository.userRepository.UserRepository userRepository;
    
    /**
     * Helper method to get authenticated user's ObjectId
     */
    private ObjectId getAuthenticatedUserId(Authentication authentication) {
        String email = authentication.getName();
        esprit_market.entity.user.User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + email));
        return user.getId();
    }
    
    /**
     * Get complete loyalty dashboard
     */
    @GetMapping("/dashboard")
    @Operation(summary = "Get loyalty dashboard", 
               description = "Returns complete loyalty information including points, rewards, and top shops")
    public ResponseEntity<LoyaltyDashboardDTO> getLoyaltyDashboard(Authentication authentication) {
        ObjectId userId = getAuthenticatedUserId(authentication);
        LoyaltyDashboardDTO dashboard = loyaltyService.getLoyaltyDashboard(userId);
        return ResponseEntity.ok(dashboard);
    }
    
    /**
     * Get all available rewards
     */
    @GetMapping("/rewards")
    @Operation(summary = "Get all available rewards", 
               description = "Returns all active rewards configured by admin")
    public ResponseEntity<List<LoyaltyRewardDTO>> getAvailableRewards() {
        List<LoyaltyRewardDTO> rewards = loyaltyService.getAvailableRewards();
        return ResponseEntity.ok(rewards);
    }
    
    /**
     * Get rewards user can afford
     */
    @GetMapping("/rewards/affordable")
    @Operation(summary = "Get affordable rewards", 
               description = "Returns rewards that user has enough points to convert")
    public ResponseEntity<List<LoyaltyRewardDTO>> getAffordableRewards(Authentication authentication) {
        ObjectId userId = getAuthenticatedUserId(authentication);
        List<LoyaltyRewardDTO> rewards = loyaltyService.getAffordableRewards(userId);
        return ResponseEntity.ok(rewards);
    }
    
    /**
     * Convert points to reward
     */
    @PostMapping("/rewards/convert")
    @Operation(summary = "Convert points to reward", 
               description = "Converts user's points into a usable reward (coupon/discount)")
    public ResponseEntity<UserRewardDTO> convertPointsToReward(
            Authentication authentication,
            @Valid @RequestBody ConvertPointsToRewardRequest request) {
        
        ObjectId userId = getAuthenticatedUserId(authentication);
        UserRewardDTO reward = loyaltyService.convertPointsToReward(userId, request.getRewardId());
        
        return ResponseEntity.ok(reward);
    }
    
    /**
     * Get user's active rewards
     */
    @GetMapping("/my-rewards")
    @Operation(summary = "Get my active rewards", 
               description = "Returns all active rewards owned by the user")
    public ResponseEntity<List<UserRewardDTO>> getMyActiveRewards(Authentication authentication) {
        ObjectId userId = getAuthenticatedUserId(authentication);
        List<UserRewardDTO> rewards = loyaltyService.getUserActiveRewards(userId);
        return ResponseEntity.ok(rewards);
    }
    
    /**
     * Get user's top 3 shops
     */
    @GetMapping("/top-shops")
    @Operation(summary = "Get top shops", 
               description = "Returns user's top 3 most-shopped stores (where rewards can be used)")
    public ResponseEntity<List<ShopSummaryDTO>> getTopShops(Authentication authentication) {
        ObjectId userId = getAuthenticatedUserId(authentication);
        List<ShopSummaryDTO> shops = loyaltyService.getTopShops(userId);
        return ResponseEntity.ok(shops);
    }
    
    /**
     * Get dynamic boost info
     */
    @GetMapping("/dynamic-boost")
    @Operation(summary = "Get dynamic boost", 
               description = "Returns user's current dynamic boost based on activity")
    public ResponseEntity<DynamicBoostDTO> getDynamicBoost(Authentication authentication) {
        ObjectId userId = getAuthenticatedUserId(authentication);
        double boost = loyaltyService.calculateDynamicBoost(userId);
        double effectiveRate = loyaltyService.getEffectiveBaseRate(userId);
        
        DynamicBoostDTO dto = DynamicBoostDTO.builder()
            .dynamicBoost(boost)
            .effectiveBaseRate(effectiveRate)
            .boostTier(boost >= 0.2 ? "HIGH" : boost >= 0.1 ? "MEDIUM" : "NONE")
            .build();
        
        return ResponseEntity.ok(dto);
    }
}
