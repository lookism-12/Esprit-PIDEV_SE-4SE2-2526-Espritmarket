package esprit_market.dto.recommendation;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for recommendation response from ML service
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationDTO {
    
    @JsonProperty("user_id")
    private String userId;
    
    @JsonProperty("recommendations")
    private List<ProductRecommendationDTO> recommendations;
    
    @JsonProperty("total_count")
    private Integer totalCount;
    
    @JsonProperty("algorithm_used")
    private String algorithmUsed;
    
    @JsonProperty("generated_at")
    private String generatedAt;
}