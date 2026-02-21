package esprit_market.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "internal_notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternalNotification {
    @Id
    private ObjectId id;
    
    private ObjectId userId;
    private String type;
    private String message;
    private LocalDateTime createdAt;
    private boolean read;
}
