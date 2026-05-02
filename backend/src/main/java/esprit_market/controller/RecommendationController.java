package esprit_market.controller;

import esprit_market.dto.recommendation.FeedbackRequestDTO;
import esprit_market.dto.recommendation.FeedbackResponseDTO;
import esprit_market.dto.recommendation.RecommendationDTO;
import esprit_market.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for ML Recommendation System
 */
@RestController
@RequestMapping("/api/recommendation")
@RequiredArgsConstructor
@Validated
@Slf4j
@Tag(name = "Recommendation", description = "ML-powered product recommendation system")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * Get product recommendations for a user
     * 
     * @param userId The user ID to get recommendations for
     * @return ResponseEntity with recommendations
     */
    @GetMapping("/{userId}")
    @Operation(summary = "Get product recommendations", 
               description = "Fetch personalized product recommendations for a specific user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Recommendations retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid user ID"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<RecommendationDTO> getRecommendations(
            @Parameter(description = "User ID to get recommendations for", required = true)
            @PathVariable @NotBlank(message = "User ID cannot be blank") String userId) {
        
        try {
            log.info("REST: Getting recommendations for user: {}", userId);
            
            RecommendationDTO recommendations = recommendationService.getRecommendations(userId);
            
            log.info("REST: Successfully retrieved {} recommendations for user: {}", 
                    recommendations.getTotalCount(), userId);
            
            return ResponseEntity.ok(recommendations);
            
        } catch (Exception e) {
            log.error("REST: Error getting recommendations for user: {}", userId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorRecommendation(userId, "Failed to fetch recommendations"));
        }
    }

    /**
     * Send user interaction feedback to ML service
     * 
     * @param feedbackRequest The feedback data
     * @return ResponseEntity with feedback processing result
     */
    @PostMapping("/feedback")
    @Operation(summary = "Send user interaction feedback", 
               description = "Send user interaction data to improve recommendation accuracy")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Feedback processed successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid feedback data"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<FeedbackResponseDTO> sendFeedback(
            @Parameter(description = "Feedback data", required = true)
            @Valid @RequestBody FeedbackRequestDTO feedbackRequest) {
        
        try {
            log.info("REST: Sending feedback - User: {}, Product: {}, Action: {}", 
                    feedbackRequest.getUserId(), feedbackRequest.getProductId(), feedbackRequest.getAction());
            
            FeedbackResponseDTO response = recommendationService.sendFeedback(feedbackRequest);
            
            log.info("REST: Feedback processed - Status: {}", response.getStatus());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("REST: Error processing feedback for user: {}", feedbackRequest.getUserId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorFeedbackResponse(feedbackRequest, "Failed to process feedback"));
        }
    }

    /**
     * Alternative feedback endpoint with query parameters (for backward compatibility)
     * 
     * @param userId The user ID
     * @param productId The product ID
     * @param action The action performed
     * @return ResponseEntity with feedback processing result
     */
    @PostMapping("/feedback/simple")
    @Operation(summary = "Send feedback with query parameters", 
               description = "Alternative endpoint for sending feedback using query parameters")
    public ResponseEntity<FeedbackResponseDTO> sendFeedbackSimple(
            @Parameter(description = "User ID", required = true)
            @RequestParam @NotBlank(message = "User ID cannot be blank") String userId,
            
            @Parameter(description = "Product ID", required = true)
            @RequestParam @NotBlank(message = "Product ID cannot be blank") String productId,
            
            @Parameter(description = "Action performed", required = true)
            @RequestParam @NotBlank(message = "Action cannot be blank") String action) {
        
        FeedbackRequestDTO feedbackRequest = new FeedbackRequestDTO(userId, productId, action);
        return sendFeedback(feedbackRequest);
    }

    /**
     * Health check endpoint for ML service
     * 
     * @return ResponseEntity with service status
     */
    @GetMapping("/health")
    @Operation(summary = "Check ML service health", 
               description = "Check if the ML recommendation service is available")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        
        Map<String, Object> health = new HashMap<>();
        
        try {
            boolean isAvailable = recommendationService.isServiceAvailable();
            
            health.put("status", isAvailable ? "UP" : "DOWN");
            health.put("service", "ML Recommendation Service");
            health.put("timestamp", java.time.Instant.now().toString());
            
            if (isAvailable) {
                health.put("message", "Service is available");
                return ResponseEntity.ok(health);
            } else {
                health.put("message", "Service is not available");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(health);
            }
            
        } catch (Exception e) {
            log.error("REST: Error checking ML service health", e);
            health.put("status", "ERROR");
            health.put("message", "Error checking service: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(health);
        }
    }

    /**
     * Create error recommendation response
     */
    private RecommendationDTO createErrorRecommendation(String userId, String message) {
        return RecommendationDTO.builder()
                .userId(userId)
                .recommendations(java.util.Collections.emptyList())
                .totalCount(0)
                .algorithmUsed("error")
                .generatedAt(java.time.Instant.now().toString())
                .build();
    }

    /**
     * Create error feedback response
     */
    private FeedbackResponseDTO createErrorFeedbackResponse(FeedbackRequestDTO request, String message) {
        return FeedbackResponseDTO.builder()
                .userId(request.getUserId())
                .productId(request.getProductId())
                .action(request.getAction())
                .status("error")
                .message(message)
                .processedAt(java.time.Instant.now().toString())
                .build();
    }
}