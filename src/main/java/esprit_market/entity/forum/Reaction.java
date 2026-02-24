package esprit_market.entity.forum;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "reactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reaction {
    @Id
    private ObjectId id;
    private ReactionType type;
    private ObjectId userId;
    private ObjectId postId;   // optional: reaction on post
    private ObjectId commentId; // optional: reaction on comment
    private LocalDateTime createdAt;
}
