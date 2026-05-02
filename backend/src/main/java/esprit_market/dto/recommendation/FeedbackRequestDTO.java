package esprit_market.dto.recommendation;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO for sending feedback to ML service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackRequestDTO {
    
    @NotBlank(message = "User ID is required")
    @JsonProperty("user_id")
    private String userId;
    
    @NotBlank(message = "Product ID is required")
    @JsonProperty("product_id")
    private String productId;
    
    @NotBlank(message = "Action is required")
    @Pattern(regexp = "^(view|like|purchase|add_to_cart|remove_from_cart)$", 
             message = "Action must be one of: view, like, purchase, add_to_cart, remove_from_cart")
    @JsonProperty("action")
    private String action;
}