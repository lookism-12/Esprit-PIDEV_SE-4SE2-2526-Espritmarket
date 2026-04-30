package esprit_market.entity.SAV;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "sav_feedbacks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavFeedback {
    @Id
    private ObjectId id;

    // Type: "SAV" (Complaint/Return) or "FEEDBACK" (Product Review)
    private String type;
    
    // Client message and details
    private String message;
    private int rating;
    private String reason; // Return reason
    private String problemNature; // Nature of the problem
    private String desiredSolution; // refund, exchange, repair, support, other
    
    // Status workflow
    private String status; // PENDING, INVESTIGATING, RESOLVED, ARCHIVED, REJECTED
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    
    // Admin response
    private String adminResponse;
    private Boolean readByAdmin;
    
    // Product recommendation
    private List<String> positiveTags;
    private Boolean recommendsProduct;
    
    // Images uploaded by client
    private List<String> imageUrls; // URLs of uploaded images
    
    // AI Verification fields (for future Siamese Network)
    private Double aiSimilarityScore; // 0-100 score
    private String aiDecision; // MATCH, UNCERTAIN, MISMATCH
    private String aiRecommendation; // AI recommendation text
    
    // Metadata
    @Builder.Default
    private LocalDateTime creationDate = LocalDateTime.now();
    
    private LocalDateTime lastUpdatedDate;
    private LocalDateTime resolvedDate;
    
    // CartItem relationship (OneToMany UNIDIRECTIONAL SavFeedback -> CartItem)
    private ObjectId cartItemId;

    // Claim target: PRODUCT or DELIVERY_AGENT
    private String targetType;
    private ObjectId deliveryAgentId;
    
    // User relationship
    private ObjectId userId; // Client who created the claim
}
