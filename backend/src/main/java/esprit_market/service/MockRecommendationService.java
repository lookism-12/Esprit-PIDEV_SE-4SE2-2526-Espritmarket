package esprit_market.service;

import esprit_market.dto.recommendation.FeedbackResponseDTO;
import esprit_market.dto.recommendation.ProductRecommendationDTO;
import esprit_market.dto.recommendation.RecommendationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Mock Recommendation Service for testing without FastAPI
 * Use this when the ML service is not available
 */
@Service
@Slf4j
public class MockRecommendationService {

    /**
     * Generate mock recommendations for testing
     */
    public RecommendationDTO getMockRecommendations(String userId) {
        log.info("🎭 Generating mock recommendations for user: {}", userId);
        
        RecommendationDTO dto = new RecommendationDTO();
        dto.setUserId(userId);
        dto.setAlgorithmUsed("mock-collaborative-filtering");
        dto.setGeneratedAt(Instant.now().toString());
        
        List<ProductRecommendationDTO> recommendations = new ArrayList<>();
        
        // Mock product 1
        ProductRecommendationDTO prod1 = new ProductRecommendationDTO();
        prod1.setProductId("prod-001");
        prod1.setName("Premium Wireless Headphones");
        prod1.setCategory("Electronics");
        prod1.setPrice(89.99);
        prod1.setScore(0.95);
        prod1.setReason("Based on your interest in audio equipment");
        recommendations.add(prod1);
        
        // Mock product 2
        ProductRecommendationDTO prod2 = new ProductRecommendationDTO();
        prod2.setProductId("prod-002");
        prod2.setName("USB-C Fast Charger");
        prod2.setCategory("Accessories");
        prod2.setPrice(29.99);
        prod2.setScore(0.87);
        prod2.setReason("Frequently bought with your previous purchases");
        recommendations.add(prod2);
        
        // Mock product 3
        ProductRecommendationDTO prod3 = new ProductRecommendationDTO();
        prod3.setProductId("prod-003");
        prod3.setName("Portable Power Bank 20000mAh");
        prod3.setCategory("Electronics");
        prod3.setPrice(39.99);
        prod3.setScore(0.82);
        prod3.setReason("Popular in your category");
        recommendations.add(prod3);
        
        // Mock product 4
        ProductRecommendationDTO prod4 = new ProductRecommendationDTO();
        prod4.setProductId("prod-004");
        prod4.setName("Screen Protector Pack");
        prod4.setCategory("Accessories");
        prod4.setPrice(12.99);
        prod4.setScore(0.78);
        prod4.setReason("Complements your recent views");
        recommendations.add(prod4);
        
        // Mock product 5
        ProductRecommendationDTO prod5 = new ProductRecommendationDTO();
        prod5.setProductId("prod-005");
        prod5.setName("Bluetooth Speaker");
        prod5.setCategory("Electronics");
        prod5.setPrice(49.99);
        prod5.setScore(0.75);
        prod5.setReason("Trending in your region");
        recommendations.add(prod5);
        
        dto.setRecommendations(recommendations);
        dto.setTotalCount(recommendations.size());
        
        log.info("🎭 Generated {} mock recommendations", recommendations.size());
        return dto;
    }

    /**
     * Generate mock feedback response
     */
    public FeedbackResponseDTO getMockFeedbackResponse(String userId, String productId, String action) {
        log.info("🎭 Processing mock feedback - User: {}, Product: {}, Action: {}", userId, productId, action);
        
        FeedbackResponseDTO response = new FeedbackResponseDTO();
        response.setUserId(userId);
        response.setProductId(productId);
        response.setAction(action);
        response.setStatus("success");
        response.setMessage("Mock feedback processed successfully");
        response.setProcessedAt(Instant.now().toString());
        
        log.info("🎭 Mock feedback response created");
        return response;
    }
}