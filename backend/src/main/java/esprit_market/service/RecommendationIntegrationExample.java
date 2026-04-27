package esprit_market.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Example integration class showing how to integrate ML recommendations
 * with existing marketplace services
 * 
 * This is a reference implementation - integrate these patterns into your existing services
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RecommendationIntegrationExample {

    private final RecommendationIntegrationService recommendationIntegration;

    /**
     * Example: How to integrate with FavorisService
     * Add this to your existing FavorisService.addFavoris() method
     */
    public void exampleFavorisIntegration(String userId, String productId) {
        // Your existing favoris logic here...
        
        // Add this line to track the like action
        recommendationIntegration.trackProductLike(userId, productId);
        
        log.info("Added to favorites and tracked ML feedback for user: {}, product: {}", userId, productId);
    }

    /**
     * Example: How to integrate with ProductService
     * Add this to your existing ProductService.getProductById() method
     */
    public void exampleProductViewIntegration(String userId, String productId) {
        // Your existing product retrieval logic here...
        
        // Add this line to track the view action
        recommendationIntegration.trackProductView(userId, productId);
        
        log.info("Product viewed and tracked ML feedback for user: {}, product: {}", userId, productId);
    }

    /**
     * Example: How to integrate with CartService
     * Add this to your existing CartService.addToCart() method
     */
    public void exampleAddToCartIntegration(String userId, String productId) {
        // Your existing add to cart logic here...
        
        // Add this line to track the add to cart action
        recommendationIntegration.trackAddToCart(userId, productId);
        
        log.info("Added to cart and tracked ML feedback for user: {}, product: {}", userId, productId);
    }

    /**
     * Example: How to integrate with CartService
     * Add this to your existing CartService.removeFromCart() method
     */
    public void exampleRemoveFromCartIntegration(String userId, String productId) {
        // Your existing remove from cart logic here...
        
        // Add this line to track the remove from cart action
        recommendationIntegration.trackRemoveFromCart(userId, productId);
        
        log.info("Removed from cart and tracked ML feedback for user: {}, product: {}", userId, productId);
    }

    /**
     * Example: How to integrate with OrderService
     * Add this to your existing OrderService.completeOrder() method
     */
    public void examplePurchaseIntegration(String userId, java.util.List<String> productIds) {
        // Your existing order completion logic here...
        
        // Add this line to track the purchase actions
        recommendationIntegration.trackMultiplePurchases(userId, productIds);
        
        log.info("Order completed and tracked ML feedback for user: {}, products: {}", userId, productIds.size());
    }
}

/*
INTEGRATION INSTRUCTIONS:

1. For FavorisService.java:
   Add this line in your addFavoris() method:
   recommendationIntegrationService.trackProductLike(userId, productId);

2. For ProductService.java:
   Add this line in your getProductById() method:
   recommendationIntegrationService.trackProductView(userId, productId);

3. For CartService.java:
   Add this line in your addToCart() method:
   recommendationIntegrationService.trackAddToCart(userId, productId);
   
   Add this line in your removeFromCart() method:
   recommendationIntegrationService.trackRemoveFromCart(userId, productId);

4. For OrderService.java:
   Add this line in your completeOrder() method:
   recommendationIntegrationService.trackMultiplePurchases(userId, productIds);

5. Don't forget to inject RecommendationIntegrationService in your existing services:
   private final RecommendationIntegrationService recommendationIntegrationService;

The tracking is async and won't affect your existing performance.
If the ML service is down, it will fail silently without affecting your main operations.
*/