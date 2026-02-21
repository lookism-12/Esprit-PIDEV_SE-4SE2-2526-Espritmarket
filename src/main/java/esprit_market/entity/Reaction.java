package esprit_market.entity;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "reactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reaction {
    @Id
    private ObjectId id;
    
    // User — Reaction (OneToMany BIDIRECTIONAL)
    private ObjectId userId;
    
    // Comment — Reaction (OneToMany BIDIRECTIONAL)
    private ObjectId commentId;
    
    private String type; // LIKE, LOVE, etc.
}
