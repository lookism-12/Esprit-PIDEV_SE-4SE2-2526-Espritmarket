package esprit_market.dto.recommendation;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for individual product recommendation.
 * Enriched by Spring Boot with real product data from MongoDB
 * before being returned to the frontend.
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

    /** First image URL from the real product record (Cloudinary or local). */
    @JsonProperty("image_url")
    private String imageUrl;

    /** Whether the product is still in stock (stock > 0). */
    @JsonProperty("in_stock")
    private Boolean inStock;

    /** Whether the product is negotiable. */
    @JsonProperty("is_negotiable")
    private Boolean isNegotiable;
}