package esprit_market.dto.recommendation;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for individual product recommendation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRecommendationDTO {
    
    @JsonProperty("product_id")
    private String productId;
    
    @JsonProperty("score")
    private Double score;
    
    @JsonProperty("reason")
    private String reason;
    
    @JsonProperty("category")
    private String category;
    
    @JsonProperty("price")
    private Double price;
    
    @JsonProperty("name")
    private String name;
}