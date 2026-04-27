package esprit_market.dto.recommendation;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for feedback response from ML service
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponseDTO {
    
    @JsonProperty("status")
    private String status;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("user_id")
    private String userId;
    
    @JsonProperty("product_id")
    private String productId;
    
    @JsonProperty("action")
    private String action;
    
    @JsonProperty("processed_at")
    private String processedAt;
}