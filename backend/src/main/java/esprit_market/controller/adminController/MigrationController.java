package esprit_market.controller.adminController;

import esprit_market.service.migration.OrderItemMigrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Migration Controller
 * 
 * Provides endpoints for data migration tasks.
 * 
 * Base path: /api/admin/migrate
 * 
 * Security: ADMIN role required
 */
@RestController
@RequestMapping("/api/admin/migrate")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class MigrationController {

    private final OrderItemMigrationService orderItemMigrationService;

    /**
     * Migrate OrderItems to populate missing shopId
     * 
     * POST /api/admin/migrate/order-items-shopid
     * 
     * This endpoint fixes existing OrderItems that don't have shopId populated.
     * It copies shopId from the related Product entity.
     * 
     * @return Migration result with statistics
     */
    @PostMapping("/order-items-shopid")
    public ResponseEntity<Map<String, Object>> migrateOrderItemsShopId() {
        log.info("🔧 Migration endpoint called: /api/admin/migrate/order-items-shopid");
        
        try {
            OrderItemMigrationService.MigrationResult result = 
                orderItemMigrationService.migrateOrderItemsShopId();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("totalItems", result.getTotalItems());
            response.put("updatedCount", result.getUpdatedCount());
            response.put("alreadyHasShopId", result.getAlreadyHasShopId());
            response.put("noProductFound", result.getNoProductFound());
            response.put("productHasNoShopId", result.getProductHasNoShopId());
            response.put("errorCount", result.getErrorCount());
            response.put("message", result.getSummary());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Migration failed: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("message", "Migration failed. Check server logs for details.");
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Health check endpoint
     * 
     * GET /api/admin/migrate/health
     * 
     * @return Simple health check response
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Migration Controller");
        return ResponseEntity.ok(response);
    }
}
