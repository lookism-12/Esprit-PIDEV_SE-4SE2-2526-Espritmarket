package esprit_market.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "external_notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalNotification {
    @Id
    private ObjectId id;
    
    // User — ExternalNotification (ManyToMany BIDIRECTIONAL)
    private List<ObjectId> userIds = new ArrayList<>();
    
    private String title;
    private String description;
    
    // Linked to Events and Promotions
    private ObjectId linkedEventId;
    private ObjectId linkedPromotionId;
}
