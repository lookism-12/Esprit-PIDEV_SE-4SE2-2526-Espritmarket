package esprit_market.dto.SAV;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavFeedbackResponseDTO {
    private String id;
    private String type;
    private String message;
    private int rating;
    private String reason;
    private String status;
    private String problemNature;
    private String priority;
    private String desiredSolution;
    private List<String> positiveTags;
    private Boolean recommendsProduct;
    private String adminResponse;
    private Boolean readByAdmin;
    
    // Images
    private List<String> imageUrls;
    
    // AI Verification
    private Double aiSimilarityScore;
    private String aiDecision;
    private String aiRecommendation;
    
    // Metadata
    private LocalDateTime creationDate;
    private LocalDateTime lastUpdatedDate;
    private LocalDateTime resolvedDate;
    
    // Relationships
    private String cartItemId;
    private String userId;
}
