package esprit_market.controller.testController;

import esprit_market.dto.recommendation.RecommendationDTO;
import esprit_market.service.RecommendationIntegrationService;
import esprit_market.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Test controller for ML Recommendation System
 * Use this to test the integration before deploying to production
 */
@RestController
@RequestMapping("/api/test/recommendation")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class RecommendationTestController {

    private final RecommendationService recommendationService;
    private final RecommendationIntegrationService integrationService;

    /**
     * Test basic recommendation functionality
     */
    @GetMapping("/test-recommendations/{userId}")
    public ResponseEntity<RecommendationDTO> testRecommendations(@PathVariable String userId) {
        log.info("🧪 Testing recommendations for user: {}", userId);
        
        RecommendationDTO recommendations = recommendationService.getRecommendations(userId);
        
        return ResponseEntity.ok(recommendations);
    }

    /**
     * Test feedback functionality
     */
    @PostMapping("/test-feedback")
    public ResponseEntity<Map<String, Object>> testFeedback(
            @RequestParam String userId,
            @RequestParam String productId,
            @RequestParam String action) {
        
        log.info("🧪 Testing feedback - User: {}, Product: {}, Action: {}", userId, productId, action);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            var response = recommendationService.sendFeedback(userId, productId, action);
            result.put("success", true);
            result.put("response", response);
            result.put("message", "Feedback sent successfully");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("🧪 Test feedback failed", e);
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("message", "Feedback test failed");
            
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Test integration service methods
     */
    @PostMapping("/test-integration/{action}")
    public ResponseEntity<Map<String, String>> testIntegration(
            @PathVariable String action,
            @RequestParam String userId,
            @RequestParam String productId) {
        
        log.info("🧪 Testing integration - Action: {}, User: {}, Product: {}", action, userId, productId);
        
        Map<String, String> result = new HashMap<>();
        
        try {
            switch (action.toLowerCase()) {
                case "view":
                    integrationService.trackProductView(userId, productId);
                    break;
                case "like":
                    integrationService.trackProductLike(userId, productId);
                    break;
                case "add_to_cart":
                    integrationService.trackAddToCart(userId, productId);
                    break;
                case "remove_from_cart":
                    integrationService.trackRemoveFromCart(userId, productId);
                    break;
                case "purchase":
                    integrationService.trackPurchase(userId, productId);
                    break;
                default:
                    result.put("status", "error");
                    result.put("message", "Invalid action: " + action);
                    return ResponseEntity.badRequest().body(result);
            }
            
            result.put("status", "success");
            result.put("message", "Integration test completed for action: " + action);
            result.put("note", "Check logs for async processing results");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("🧪 Integration test failed", e);
            result.put("status", "error");
            result.put("message", "Integration test failed: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Test ML service health
     */
    @GetMapping("/test-health")
    public ResponseEntity<Map<String, Object>> testHealth() {
        log.info("🧪 Testing ML service health");
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            boolean isAvailable = recommendationService.isServiceAvailable();
            
            result.put("ml_service_available", isAvailable);
            result.put("status", isAvailable ? "healthy" : "unhealthy");
            result.put("timestamp", java.time.Instant.now().toString());
            
            if (isAvailable) {
                result.put("message", "ML service is running and accessible");
                return ResponseEntity.ok(result);
            } else {
                result.put("message", "ML service is not accessible");
                return ResponseEntity.ok(result); // Still 200 OK, but service is down
            }
            
        } catch (Exception e) {
            log.error("🧪 Health test failed", e);
            result.put("status", "error");
            result.put("message", "Health check failed: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Get test instructions
     */
    @GetMapping("/instructions")
    public ResponseEntity<Map<String, Object>> getTestInstructions() {
        Map<String, Object> instructions = new HashMap<>();
        
        instructions.put("title", "ML Recommendation System Test Instructions");
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("GET /api/test/recommendation/test-recommendations/{userId}", "Test getting recommendations for a user");
        endpoints.put("POST /api/test/recommendation/test-feedback?userId=X&productId=Y&action=Z", "Test sending feedback");
        endpoints.put("POST /api/test/recommendation/test-integration/{action}?userId=X&productId=Y", "Test integration methods");
        endpoints.put("GET /api/test/recommendation/test-health", "Test ML service health");
        
        instructions.put("endpoints", endpoints);
        
        Map<String, String> actions = new HashMap<>();
        actions.put("view", "Track product view");
        actions.put("like", "Track product like");
        actions.put("add_to_cart", "Track add to cart");
        actions.put("remove_from_cart", "Track remove from cart");
        actions.put("purchase", "Track purchase");
        
        instructions.put("available_actions", actions);
        
        instructions.put("example_test", "POST /api/test/recommendation/test-integration/view?userId=user123&productId=prod456");
        
        return ResponseEntity.ok(instructions);
    }
}