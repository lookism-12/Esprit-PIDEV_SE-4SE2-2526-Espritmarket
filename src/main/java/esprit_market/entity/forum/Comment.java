package esprit_market.entity.forum;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    @Id
    private ObjectId id;
    private ObjectId postId;
    private ObjectId userId;
    private ObjectId parentCommentId; // for replies to other comments
    private String content;
    private LocalDateTime createdAt;
    private List<ObjectId> reactionIds = new ArrayList<>();
}
