package esprit_market.config;

import esprit_market.dto.recommendation.FeedbackResponseDTO;
import esprit_market.dto.recommendation.RecommendationDTO;
import esprit_market.service.MockRecommendationService;
import esprit_market.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Development configuration for recommendation service
 * Provides fallback to mock service when real ML service is unavailable
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class RecommendationDevConfig {

    private final RecommendationService realService;
    private final MockRecommendationService mockService;

    /**
     * Wrapper service that falls back to mock when real service fails
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "app.ml-service.use-fallback", havingValue = "true", matchIfMissing = false)
    public RecommendationServiceWrapper recommendationServiceWrapper() {
        log.info("🔧 Initializing RecommendationServiceWrapper with fallback to mock service");
        return new RecommendationServiceWrapper(realService, mockService);
    }

    /**
     * Wrapper class that provides fallback functionality
     */
    @Slf4j
    public static class RecommendationServiceWrapper {
        private final RecommendationService realService;
        private final MockRecommendationService mockService;

        public RecommendationServiceWrapper(RecommendationService realService, MockRecommendationService mockService) {
            this.realService = realService;
            this.mockService = mockService;
        }

        public RecommendationDTO getRecommendations(String userId) {
            try {
                log.debug("🔄 Attempting to fetch real recommendations for user: {}", userId);
                RecommendationDTO result = realService.getRecommendations(userId);
                
                // If we got empty results, try mock
                if (result.getTotalCount() == 0) {
                    log.warn("⚠️ Real service returned empty results, using mock recommendations");
                    return mockService.getMockRecommendations(userId);
                }
                
                return result;
            } catch (Exception e) {
                log.warn("⚠️ Real service failed, falling back to mock: {}", e.getMessage());
                return mockService.getMockRecommendations(userId);
            }
        }

        public FeedbackResponseDTO sendFeedback(String userId, String productId, String action) {
            try {
                log.debug("🔄 Attempting to send real feedback");
                return realService.sendFeedback(userId, productId, action);
            } catch (Exception e) {
                log.warn("⚠️ Real service failed, using mock feedback response: {}", e.getMessage());
                return mockService.getMockFeedbackResponse(userId, productId, action);
            }
        }

        public boolean isServiceAvailable() {
            return realService.isServiceAvailable();
        }
    }
}