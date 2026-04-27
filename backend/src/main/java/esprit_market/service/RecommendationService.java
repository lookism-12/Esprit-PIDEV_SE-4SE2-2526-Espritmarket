package esprit_market.service;

import esprit_market.config.RecommendationConfig;
import esprit_market.dto.recommendation.FeedbackRequestDTO;
import esprit_market.dto.recommendation.FeedbackResponseDTO;
import esprit_market.dto.recommendation.RecommendationDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Collections;

/**
 * Service for integrating with ML Recommendation System
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    @Qualifier("recommendationWebClient")
    private final WebClient webClient;
    
    private final RecommendationConfig config;
    private final MockRecommendationService mockService;

    /**
     * Get product recommendations for a user
     * 
     * @param userId The user ID to get recommendations for
     * @return RecommendationDTO with recommended products
     */
    public RecommendationDTO getRecommendations(String userId) {
        if (!config.isEnabled()) {
            log.warn("ML Recommendation service is disabled, using mock data");
            return mockService.getMockRecommendations(userId);
        }

        try {
            log.info("Fetching recommendations for user: {}", userId);
            
            RecommendationDTO result = webClient
                    .get()
                    .uri("/recommend/{userId}", userId)
                    .retrieve()
                    .bodyToMono(RecommendationDTO.class)
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                    .retryWhen(Retry.backoff(config.getMaxRetries(), Duration.ofSeconds(1))
                            .filter(this::isRetryableException))
                    .doOnSuccess(response -> log.info("Successfully fetched {} recommendations for user: {}", 
                            response.getTotalCount(), userId))
                    .doOnError(error -> log.error("Failed to fetch recommendations for user: {}", userId, error))
                    .onErrorReturn(null)
                    .block();

            // If real service returned data, use it
            if (result != null && result.getTotalCount() > 0) {
                return result;
            }
            
            // Fallback to mock data
            log.warn("⚠️ Real service unavailable or returned empty results, using mock recommendations");
            return mockService.getMockRecommendations(userId);
            
        } catch (Exception e) {
            log.error("Unexpected error while fetching recommendations for user: {}, using mock data", userId, e);
            return mockService.getMockRecommendations(userId);
        }
    }

    /**
     * Send user interaction feedback to ML service
     * 
     * @param userId The user ID
     * @param productId The product ID
     * @param action The action performed (view, like, purchase, etc.)
     * @return FeedbackResponseDTO with processing result
     */
    public FeedbackResponseDTO sendFeedback(String userId, String productId, String action) {
        if (!config.isEnabled()) {
            log.warn("ML Recommendation service is disabled, using mock feedback");
            return mockService.getMockFeedbackResponse(userId, productId, action);
        }

        try {
            log.info("Sending feedback - User: {}, Product: {}, Action: {}", userId, productId, action);
            
            FeedbackResponseDTO result = webClient
                    .post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/feedback")
                            .queryParam("user_id", userId)
                            .queryParam("product_id", productId)
                            .queryParam("action", action)
                            .build())
                    .retrieve()
                    .bodyToMono(FeedbackResponseDTO.class)
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                    .retryWhen(Retry.backoff(config.getMaxRetries(), Duration.ofSeconds(1))
                            .filter(this::isRetryableException))
                    .doOnSuccess(response -> log.info("Successfully sent feedback for user: {} - Status: {}", 
                            userId, response.getStatus()))
                    .doOnError(error -> log.error("Failed to send feedback for user: {}", userId, error))
                    .onErrorReturn(null)
                    .block();

            // If real service returned data, use it
            if (result != null) {
                return result;
            }
            
            // Fallback to mock response
            log.warn("⚠️ Real service unavailable, using mock feedback response");
            return mockService.getMockFeedbackResponse(userId, productId, action);
            
        } catch (Exception e) {
            log.error("Unexpected error while sending feedback for user: {}, using mock response", userId, e);
            return mockService.getMockFeedbackResponse(userId, productId, action);
        }
    }

    /**
     * Send feedback using DTO
     * 
     * @param feedbackRequest The feedback request DTO
     * @return FeedbackResponseDTO with processing result
     */
    public FeedbackResponseDTO sendFeedback(FeedbackRequestDTO feedbackRequest) {
        return sendFeedback(
                feedbackRequest.getUserId(),
                feedbackRequest.getProductId(),
                feedbackRequest.getAction()
        );
    }

    /**
     * Check if ML service is available
     * 
     * @return true if service is reachable, false otherwise
     */
    public boolean isServiceAvailable() {
        if (!config.isEnabled()) {
            return false;
        }

        try {
            webClient
                    .get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            return true;
        } catch (Exception e) {
            log.warn("ML Recommendation service is not available: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Determine if an exception is retryable
     */
    private boolean isRetryableException(Throwable throwable) {
        if (throwable instanceof WebClientResponseException) {
            WebClientResponseException ex = (WebClientResponseException) throwable;
            // Retry on 5xx server errors, but not on 4xx client errors
            return ex.getStatusCode().is5xxServerError();
        }
        // Retry on network issues
        return throwable instanceof WebClientException;
    }

    /**
     * Create empty recommendation response for fallback
     */
    private RecommendationDTO createEmptyRecommendation(String userId) {
        RecommendationDTO empty = new RecommendationDTO();
        empty.setUserId(userId);
        empty.setRecommendations(Collections.emptyList());
        empty.setTotalCount(0);
        empty.setAlgorithmUsed("fallback");
        empty.setGeneratedAt(java.time.Instant.now().toString());
        return empty;
    }

    /**
     * Create default feedback response for fallback
     */
    private FeedbackResponseDTO createDefaultFeedbackResponse(String userId, String productId, String action, String message) {
        FeedbackResponseDTO response = new FeedbackResponseDTO();
        response.setUserId(userId);
        response.setProductId(productId);
        response.setAction(action);
        response.setStatus("fallback");
        response.setMessage(message);
        response.setProcessedAt(java.time.Instant.now().toString());
        return response;
    }
}