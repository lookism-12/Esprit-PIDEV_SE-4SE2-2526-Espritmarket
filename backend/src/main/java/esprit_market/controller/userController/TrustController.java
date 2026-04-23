package esprit_market.controller.userController;

import esprit_market.Enum.userEnum.TrustBadge;
import esprit_market.dto.userDto.TrustScoreDTO;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.userService.TrustService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Trust & Reputation System
 * 
 * Endpoints:
 * - GET /api/trust/sellers/{id}/score - Get seller's trust score
 * - GET /api/trust/sellers/{id}/badge - Get seller's trust badge
 * - POST /api/trust/sellers/{id}/recalculate - Manually recalculate trust score (admin)
 * - GET /api/trust/shops/{id}/score - Get shop's trust score
 */
@RestController
@RequestMapping("/api/trust")
@RequiredArgsConstructor
@Tag(name = "Trust & Reputation", description = "Seller trust score and reputation management")
public class TrustController {
    
    private final TrustService trustService;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    
    /**
     * Get seller's trust score and statistics
     */
    @GetMapping("/sellers/{id}/score")
    @Operation(summary = "Get seller trust score", description = "Returns complete trust score information for a seller")
    public ResponseEntity<TrustScoreDTO> getSellerTrustScore(@PathVariable String id) {
        ObjectId sellerId = new ObjectId(id);
        
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found"));
        
        double trustScore = seller.getTrustScore();
        TrustBadge badge = trustService.getTrustBadge(trustScore);
        
        TrustScoreDTO dto = TrustScoreDTO.builder()
                .sellerId(id)
                .sellerName(seller.getFirstName() + " " + seller.getLastName())
                .trustScore(trustScore)
                .trustBadge(badge.name())
                .badgeColor(badge.getColor())
                .totalSales(seller.getTotalSales())
                .approvedProducts(seller.getApprovedProducts())
                .rejectedProducts(seller.getRejectedProducts())
                .averageRating(seller.getAverageRating())
                .totalRatings(seller.getTotalRatings())
                .build();
        
        return ResponseEntity.ok(dto);
    }
    
    /**
     * Get seller's trust badge
     */
    @GetMapping("/sellers/{id}/badge")
    @Operation(summary = "Get seller trust badge", description = "Returns trust badge level for a seller")
    public ResponseEntity<String> getSellerBadge(@PathVariable String id) {
        ObjectId sellerId = new ObjectId(id);
        
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found"));
        
        TrustBadge badge = trustService.getTrustBadge(seller.getTrustScore());
        
        return ResponseEntity.ok(badge.name());
    }
    
    /**
     * Manually recalculate seller's trust score (admin only)
     */
    @PostMapping("/sellers/{id}/recalculate")
    @Operation(summary = "Recalculate trust score", description = "Manually trigger trust score recalculation (admin)")
    public ResponseEntity<TrustScoreDTO> recalculateTrustScore(@PathVariable String id) {
        ObjectId sellerId = new ObjectId(id);
        
        // Trigger recalculation
        trustService.updateSellerTrustScore(sellerId);
        
        // Return updated score
        return getSellerTrustScore(id);
    }
    
    /**
     * Recalculate ALL trust scores (admin only)
     */
    @PostMapping("/recalculate-all")
    @Operation(summary = "Recalculate all trust scores", description = "Recalculate trust scores for all sellers (admin)")
    public ResponseEntity<String> recalculateAllTrustScores() {
        trustService.recalculateAllTrustScores();
        return ResponseEntity.ok("Trust scores recalculation triggered for all sellers. Check logs for details.");
    }
    
    /**
     * Get shop's trust score
     */
    @GetMapping("/shops/{id}/score")
    @Operation(summary = "Get shop trust score", description = "Returns trust score for a shop")
    public ResponseEntity<TrustScoreDTO> getShopTrustScore(@PathVariable String id) {
        ObjectId shopId = new ObjectId(id);
        
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        
        // Get owner's trust score
        return getSellerTrustScore(shop.getOwnerId().toHexString());
    }
}
