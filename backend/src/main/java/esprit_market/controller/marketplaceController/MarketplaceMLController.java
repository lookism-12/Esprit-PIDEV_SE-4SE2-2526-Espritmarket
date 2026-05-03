package esprit_market.controller.marketplaceController;

import esprit_market.dto.cartDto.CartMLResponse;
import esprit_market.service.marketplaceService.MarketplaceMLService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Marketplace ML endpoints — promotion badges and price signals for products.
 * Endpoint: /api/marketplace/ml/*
 *
 * Used by:
 *  - Products listing page  → batch predictions for visible products
 *  - Product details page   → single prediction for the open product
 *  - Admin marketplace      → insights panel
 */
@Slf4j
@RestController
@RequestMapping("/api/marketplace/ml")
@RequiredArgsConstructor
@Tag(name = "Marketplace ML", description = "AI-powered product insights for the marketplace")
public class MarketplaceMLController {

    private final MarketplaceMLService marketplaceMLService;

    /**
     * GET /api/marketplace/ml/product/{productId}
     * Single product ML insight.
     */
    @GetMapping("/product/{productId}")
    @Operation(summary = "Get ML insight for a single product")
    public ResponseEntity<CartMLResponse> getProductInsight(@PathVariable String productId) {
        CartMLResponse result = marketplaceMLService.predictForProduct(productId);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/marketplace/ml/products/batch
     * Batch ML insights for a list of product IDs.
     * Body: { "productIds": ["id1", "id2", ...] }
     */
    @PostMapping("/products/batch")
    @Operation(summary = "Get ML insights for multiple products")
    public ResponseEntity<List<CartMLResponse>> getBatchInsights(
            @RequestBody Map<String, List<String>> body) {

        List<String> productIds = body.get("productIds");
        if (productIds == null || productIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        // Cap at 50 products per request to avoid overloading the ML service
        List<String> capped = productIds.size() > 50
                ? productIds.subList(0, 50)
                : productIds;

        List<CartMLResponse> results = marketplaceMLService.predictBatch(capped);
        log.info("🤖 Marketplace ML batch: {} insights returned", results.size());
        return ResponseEntity.ok(results);
    }

    /**
     * GET /api/marketplace/ml/health
     * Check if the ML Python service is reachable.
     */
    @GetMapping("/health")
    @Operation(summary = "Check Marketplace ML service health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean up = marketplaceMLService.isServiceAvailable();
        return ResponseEntity.ok(Map.of(
                "status",  up ? "UP" : "DOWN",
                "service", "Marketplace ML (ai-cart port 8002)",
                "message", up ? "ML service is running" : "ML service unavailable — using fallback"
        ));
    }
}
