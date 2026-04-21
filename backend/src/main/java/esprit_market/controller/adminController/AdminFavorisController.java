package esprit_market.controller.adminController;

import esprit_market.dto.marketplace.FavorisResponseDTO;
import esprit_market.service.marketplaceService.IFavorisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * Admin Controller for Favoris Management
 * 
 * This controller provides admin-specific endpoints for managing favorites.
 * All endpoints require ADMIN role.
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/favoris")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Favoris", description = "Admin endpoints for managing all favorites")
public class AdminFavorisController {
    
    private final IFavorisService favorisService;

    /**
     * Get all favorites in the system (Admin only)
     * 
     * @return List of all favorites with proper error handling
     */
    @GetMapping
    @Operation(summary = "Get all favorites (Admin only)", 
               description = "Retrieves all favorites from all users. Returns empty list if none found.")
    public ResponseEntity<List<FavorisResponseDTO>> getAllFavorites() {
        try {
            log.info("📊 Admin requesting all favorites");
            
            List<FavorisResponseDTO> favorites = favorisService.findAll();
            
            if (favorites == null || favorites.isEmpty()) {
                log.info("✅ No favorites found in database");
                return ResponseEntity.ok(Collections.emptyList());
            }
            
            log.info("✅ Successfully retrieved {} favorites", favorites.size());
            return ResponseEntity.ok(favorites);
            
        } catch (Exception e) {
            log.error("❌ Error retrieving all favorites", e);
            log.error("❌ Error type: {}", e.getClass().getSimpleName());
            log.error("❌ Error message: {}", e.getMessage());
            
            // Return empty list instead of 500 to prevent frontend crash
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    /**
     * Get favorites statistics (Admin only)
     * 
     * @return Statistics about favorites
     */
    @GetMapping("/stats")
    @Operation(summary = "Get favorites statistics", 
               description = "Returns statistics about favorites (total count, by type, etc.)")
    public ResponseEntity<?> getFavoritesStats() {
        try {
            log.info("📊 Admin requesting favorites statistics");
            
            List<FavorisResponseDTO> allFavorites = favorisService.findAll();
            
            long totalFavorites = allFavorites.size();
            long productFavorites = allFavorites.stream()
                .filter(f -> f.getProductId() != null)
                .count();
            long serviceFavorites = allFavorites.stream()
                .filter(f -> f.getServiceId() != null)
                .count();
            
            var stats = new java.util.HashMap<String, Object>();
            stats.put("totalFavorites", totalFavorites);
            stats.put("productFavorites", productFavorites);
            stats.put("serviceFavorites", serviceFavorites);
            
            log.info("✅ Statistics: {} total, {} products, {} services", 
                     totalFavorites, productFavorites, serviceFavorites);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("❌ Error retrieving favorites statistics", e);
            
            var errorStats = new java.util.HashMap<String, Object>();
            errorStats.put("totalFavorites", 0);
            errorStats.put("productFavorites", 0);
            errorStats.put("serviceFavorites", 0);
            errorStats.put("error", "Failed to load statistics");
            
            return ResponseEntity.ok(errorStats);
        }
    }

    /**
     * Delete a favorite by ID (Admin only)
     * 
     * @param id The favorite ID to delete
     * @return Success message or error
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a favorite (Admin only)")
    public ResponseEntity<?> deleteFavorite(@PathVariable String id) {
        try {
            log.info("🗑️ Admin deleting favorite with id: {}", id);
            
            favorisService.delete(new org.bson.types.ObjectId(id));
            
            log.info("✅ Successfully deleted favorite: {}", id);
            return ResponseEntity.ok().body(
                java.util.Map.of("message", "Favorite deleted successfully", "id", id)
            );
            
        } catch (esprit_market.config.Exceptions.ResourceNotFoundException e) {
            log.warn("⚠️ Favorite not found: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                java.util.Map.of("error", "Favorite not found", "id", id)
            );
            
        } catch (IllegalArgumentException e) {
            log.error("❌ Invalid ID format: {}", id);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                java.util.Map.of("error", "Invalid ID format", "id", id)
            );
            
        } catch (Exception e) {
            log.error("❌ Error deleting favorite: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                java.util.Map.of("error", "Failed to delete favorite", "id", id)
            );
        }
    }

    /**
     * Health check endpoint for admin favoris
     */
    @GetMapping("/health")
    @Operation(summary = "Health check for admin favoris endpoint")
    public ResponseEntity<?> healthCheck() {
        try {
            long count = favorisService.findAll().size();
            return ResponseEntity.ok(java.util.Map.of(
                "status", "healthy",
                "endpoint", "/api/admin/favoris",
                "totalFavorites", count,
                "timestamp", java.time.LocalDateTime.now()
            ));
        } catch (Exception e) {
            log.error("❌ Health check failed", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(
                java.util.Map.of(
                    "status", "unhealthy",
                    "error", e.getMessage(),
                    "timestamp", java.time.LocalDateTime.now()
                )
            );
        }
    }
}
