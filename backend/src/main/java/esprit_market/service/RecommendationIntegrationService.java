package esprit_market.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Integration service for easy recommendation system integration
 * This service provides convenient methods to integrate ML recommendations
 * with existing marketplace operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationIntegrationService {

    private final RecommendationService recommendationService;

    /**
     * Track product view (async)
     */
    @Async
    public void trackProductView(String userId, String productId) {
        if (userId != null && productId != null) {
            try {
                recommendationService.sendFeedback(userId, productId, "view");
                log.debug("Tracked product view - User: {}, Product: {}", userId, productId);
            } catch (Exception e) {
                log.warn("Failed to track product view - User: {}, Product: {}", userId, productId, e);
            }
        }
    }

    /**
     * Track product like (async)
     */
    @Async
    public void trackProductLike(String userId, String productId) {
        if (userId != null && productId != null) {
            try {
                recommendationService.sendFeedback(userId, productId, "like");
                log.debug("Tracked product like - User: {}, Product: {}", userId, productId);
            } catch (Exception e) {
                log.warn("Failed to track product like - User: {}, Product: {}", userId, productId, e);
            }
        }
    }

    /**
     * Track add to cart (async)
     */
    @Async
    public void trackAddToCart(String userId, String productId) {
        if (userId != null && productId != null) {
            try {
                recommendationService.sendFeedback(userId, productId, "add_to_cart");
                log.debug("Tracked add to cart - User: {}, Product: {}", userId, productId);
            } catch (Exception e) {
                log.warn("Failed to track add to cart - User: {}, Product: {}", userId, productId, e);
            }
        }
    }

    /**
     * Track remove from cart (async)
     */
    @Async
    public void trackRemoveFromCart(String userId, String productId) {
        if (userId != null && productId != null) {
            try {
                recommendationService.sendFeedback(userId, productId, "remove_from_cart");
                log.debug("Tracked remove from cart - User: {}, Product: {}", userId, productId);
            } catch (Exception e) {
                log.warn("Failed to track remove from cart - User: {}, Product: {}", userId, productId, e);
            }
        }
    }

    /**
     * Track purchase (async)
     */
    @Async
    public void trackPurchase(String userId, String productId) {
        if (userId != null && productId != null) {
            try {
                recommendationService.sendFeedback(userId, productId, "purchase");
                log.debug("Tracked purchase - User: {}, Product: {}", userId, productId);
            } catch (Exception e) {
                log.warn("Failed to track purchase - User: {}, Product: {}", userId, productId, e);
            }
        }
    }

    /**
     * Track multiple purchases (for order completion)
     */
    @Async
    public void trackMultiplePurchases(String userId, java.util.List<String> productIds) {
        if (userId != null && productIds != null && !productIds.isEmpty()) {
            for (String productId : productIds) {
                trackPurchase(userId, productId);
            }
        }
    }
}