package esprit_market.dto.SAV;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SavFeedbackRequestDTO {

    @NotBlank(message = "Type (SAV or FEEDBACK) is required")
    private String type;

    @NotBlank(message = "Message is required")
    private String message;

    @Min(value = 1, message = "Minimum rating is 1")
    @Max(value = 5, message = "Maximum rating is 5")
    private int rating;

    private String reason; // Return reason
    private String status; // PENDING, INVESTIGATING, RESOLVED, ARCHIVED, REJECTED
    private String problemNature; // Nature of the problem
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    private String desiredSolution; // refund, exchange, repair, support, other
    
    private List<String> positiveTags;
    private Boolean recommendsProduct;
    private String adminResponse;
    private Boolean readByAdmin;
    
    // Images uploaded by client
    private List<String> imageUrls;

    @NotBlank(message = "CartItem ID (purchased product) is required")
    private String cartItemId;
    
    // User ID (client who created the claim)
    private String userId;
}
