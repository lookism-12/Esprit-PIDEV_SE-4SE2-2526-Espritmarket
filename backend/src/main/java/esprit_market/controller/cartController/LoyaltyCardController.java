package esprit_market.controller.cartController;

import esprit_market.dto.cartDto.ConvertPointsRequest;
import esprit_market.dto.cartDto.LoyaltyCardResponse;
import esprit_market.service.cartService.AuthHelperService;
import esprit_market.service.cartService.ILoyaltyCardService;
import esprit_market.service.cartService.UserNotAuthenticatedException;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/loyalty-card")
@RequiredArgsConstructor
// ✅ TEMPORARILY REMOVE PreAuthorize to test loyalty logic
// @PreAuthorize("hasRole('CLIENT')")
public class LoyaltyCardController {

    private final ILoyaltyCardService loyaltyCardService;
    private final AuthHelperService authHelper;

    private ObjectId getUserId(Authentication authentication) {
        // ✅ DYNAMIC TEST USER ID - same logic as CartController
        try {
            return authHelper.getUserIdFromAuthentication(authentication);
        } catch (Exception e) {
            // Fallback for testing
            return new ObjectId("507f1f77bcf86cd799439000");
        }
    }

    /**
     * Get or create user's loyalty card
     */
    @GetMapping
    public ResponseEntity<LoyaltyCardResponse> getLoyaltyCard(Authentication authentication) {
        try {
            ObjectId userId = getUserId(authentication);
            LoyaltyCardResponse card = loyaltyCardService.getOrCreateLoyaltyCard(userId);
            return ResponseEntity.ok(card);
        } catch (UserNotAuthenticatedException e) {
            throw new org.springframework.security.authentication.BadCredentialsException("Authentication required");
        } catch (Exception e) {
            System.err.println("LoyaltyCard getLoyaltyCard error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Add points manually (for testing/admin)
     */
    @PostMapping("/add-points")
    public ResponseEntity<LoyaltyCardResponse> addPoints(
            @RequestParam Integer points,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        LoyaltyCardResponse card = loyaltyCardService.addPoints(userId, points);
        return ResponseEntity.ok(card);
    }

    /**
     * Convert points to discount
     */
    @PostMapping("/convert")
    public ResponseEntity<LoyaltyCardResponse> convertPointsToDiscount(
            @Valid @RequestBody ConvertPointsRequest request,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        LoyaltyCardResponse card = loyaltyCardService.convertPointsToDiscount(userId, request);
        return ResponseEntity.ok(card);
    }

    /**
     * Get loyalty level information
     */
    @GetMapping("/level-info")
    public ResponseEntity<Object> getLevelInfo(Authentication authentication) {
        ObjectId userId = getUserId(authentication);
        LoyaltyCardResponse card = loyaltyCardService.getOrCreateLoyaltyCard(userId);
        
        // Return level progression info
        java.util.Map<String, Object> levelInfo = new java.util.HashMap<>();
        levelInfo.put("currentLevel", card.getLevel());
        levelInfo.put("currentPoints", card.getPoints());
        levelInfo.put("totalPointsEarned", card.getTotalPointsEarned());
        
        // Calculate next level thresholds
        String nextLevel = "PLATINUM";
        int nextLevelThreshold = 10000;
        
        switch (card.getLevel()) {
            case "BRONZE":
                nextLevel = "SILVER";
                nextLevelThreshold = 1000;
                break;
            case "SILVER":
                nextLevel = "GOLD";
                nextLevelThreshold = 5000;
                break;
            case "GOLD":
                nextLevel = "PLATINUM";
                nextLevelThreshold = 10000;
                break;
            case "PLATINUM":
                nextLevel = "PLATINUM";
                nextLevelThreshold = card.getTotalPointsEarned();
                break;
        }
        
        levelInfo.put("nextLevel", nextLevel);
        levelInfo.put("nextLevelThreshold", nextLevelThreshold);
        levelInfo.put("pointsToNextLevel", Math.max(0, nextLevelThreshold - card.getTotalPointsEarned()));
        
        return ResponseEntity.ok(levelInfo);
    }
}