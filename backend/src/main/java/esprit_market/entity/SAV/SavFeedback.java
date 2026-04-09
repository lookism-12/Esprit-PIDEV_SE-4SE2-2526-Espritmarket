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

    private String type; // "SAV" (Complaint) or "FEEDBACK"
    private String message;
    private int rating;
    private String reason;
    private String status; // PENDING, INVESTIGATING, RESOLVED, ARCHIVED
    private String problemNature;
    private String priority;
    private String desiredSolution;
    private List<String> positiveTags;
    private Boolean recommendsProduct;
    private String adminResponse;
    private Boolean readByAdmin;

    @Builder.Default
    private LocalDateTime creationDate = LocalDateTime.now();

    // CartItem — SavFeedback (OneToMany UNIDIRECTIONAL SavFeedback -> CartItem)
    private ObjectId cartItemId;
}
