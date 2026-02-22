package esprit_market.entity.SAV;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "sav_feedbacks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavFeedback {
    @Id
    private ObjectId id;
    
    // CartItem — SavFeedback (OneToMany UNIDIRECTIONAL SavFeedback -> CartItem)
    private ObjectId cartItemId;
    
    private String message;
    private String status;
}
