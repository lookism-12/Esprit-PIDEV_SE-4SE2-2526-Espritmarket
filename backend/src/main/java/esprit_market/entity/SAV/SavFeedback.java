package esprit_market.entity.SAV;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "sav_feedbacks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavFeedback {
    @Id
    private ObjectId id;

    private String type; // e.g. "SAV" (Complaint) or "FEEDBACK"
    private String message;
    private int rating;
    private String reason;
    private String status; // PENDING, INVESTIGATING, RESOLVED, ARCHIVED

    // Complaint-specific fields (type = SAV)
    private String problemNature; // MISSING_ITEM, DAMAGED, WRONG_ITEM, OTHER
    private String priority; // LOW, MODERATE, URGENT
    private String desiredSolution; // REFUND, RESHIP, VOUCHER, EXCHANGE

    // Feedback-specific fields (type = FEEDBACK)
    @Builder.Default
    private List<String> positiveTags = new ArrayList<>();
    private Boolean recommendsProduct;

    // Admin workflow fields
    private String adminResponse;

    @Builder.Default
    private Boolean readByAdmin = false;

    @Builder.Default
    private LocalDateTime creationDate = LocalDateTime.now();

    // Relation
    // CartItem — SavFeedback (OneToMany UNIDIRECTIONAL SavFeedback -> CartItem)
    private ObjectId cartItemId;
}
