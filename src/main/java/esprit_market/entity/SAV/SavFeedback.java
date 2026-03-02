package esprit_market.entity.SAV;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

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

    @Builder.Default
    private LocalDateTime creationDate = LocalDateTime.now();

    // Relation
    // CartItem — SavFeedback (OneToMany UNIDIRECTIONAL SavFeedback -> CartItem)
    private ObjectId cartItemId;
}
